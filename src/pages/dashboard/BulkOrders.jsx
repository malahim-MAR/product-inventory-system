import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Plus,
    Trash2,
    Upload,
    Loader2,
    AlertCircle,
    CheckCircle,
    X
} from 'lucide-react';
import {
    collection,
    query,
    where,
    getDocs,
    writeBatch,
    doc,
    serverTimestamp,
    runTransaction
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

const emptyRow = {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productId: '',
    quantity: '1',
    discount: '0',
    errors: {}
};

export default function BulkOrders() {
    const { businessId, currentUser } = useAuth();
    const [products, setProducts] = useState([]);
    const [rows, setRows] = useState([{ ...emptyRow, id: Date.now() }]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (businessId) {
            fetchProducts();
        }
    }, [businessId]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('businessId', '==', businessId));
            const snapshot = await getDocs(q);

            setProducts(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const addRow = () => {
        setRows([...rows, { ...emptyRow, id: Date.now() }]);
    };

    const removeRow = (id) => {
        if (rows.length === 1) return;
        setRows(rows.filter(row => row.id !== id));
    };

    const updateRow = (id, field, value) => {
        setRows(rows.map(row => {
            if (row.id === id) {
                return {
                    ...row,
                    [field]: value,
                    errors: { ...row.errors, [field]: null }
                };
            }
            return row;
        }));
    };

    const generateOrderNumber = () => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${year}${month}${day}-${random}`;
    };

    const validateRow = (row) => {
        const errors = {};

        if (!row.customerName?.trim()) {
            errors.customerName = 'Required';
        }

        if (!row.productId) {
            errors.productId = 'Select a product';
        }

        if (!row.quantity || isNaN(parseInt(row.quantity)) || parseInt(row.quantity) < 1) {
            errors.quantity = 'Invalid quantity';
        }

        // Check stock availability
        if (row.productId) {
            const product = products.find(p => p.id === row.productId);
            if (product && parseInt(row.quantity) > product.stock) {
                errors.quantity = `Only ${product.stock} in stock`;
            }
        }

        return errors;
    };

    const validateAllRows = () => {
        let hasErrors = false;
        const updatedRows = rows.map(row => {
            const errors = validateRow(row);
            if (Object.keys(errors).length > 0) {
                hasErrors = true;
            }
            return { ...row, errors };
        });

        setRows(updatedRows);
        return !hasErrors;
    };

    const calculateRowTotal = (row) => {
        const product = products.find(p => p.id === row.productId);
        if (!product) return 0;

        const quantity = parseInt(row.quantity) || 0;
        const discount = parseFloat(row.discount) || 0;
        const subtotal = product.price * quantity;
        return Math.max(0, subtotal - discount);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateAllRows()) {
            setError('Please fix all validation errors before submitting');
            return;
        }

        setSaving(true);

        try {
            // Group orders by customer (orders with same customer name go together)
            const ordersByCustomer = {};

            rows.forEach(row => {
                const key = row.customerName.trim().toLowerCase();
                if (!ordersByCustomer[key]) {
                    ordersByCustomer[key] = {
                        customerName: row.customerName.trim(),
                        customerPhone: row.customerPhone?.trim() || '',
                        customerEmail: row.customerEmail?.trim() || '',
                        items: []
                    };
                }

                const product = products.find(p => p.id === row.productId);
                const quantity = parseInt(row.quantity);
                const discount = parseFloat(row.discount) || 0;

                ordersByCustomer[key].items.push({
                    productId: row.productId,
                    productName: product.name,
                    quantity: quantity,
                    unitPrice: product.price,
                    total: product.price * quantity,
                    discount: discount
                });
            });

            // Create orders using transaction to update stock
            for (const [key, orderData] of Object.entries(ordersByCustomer)) {
                await runTransaction(db, async (transaction) => {
                    // Update stock for each product
                    for (const item of orderData.items) {
                        const productRef = doc(db, 'products', item.productId);
                        const productSnap = await transaction.get(productRef);

                        if (!productSnap.exists()) {
                            throw new Error(`Product ${item.productName} not found`);
                        }

                        const productData = productSnap.data();
                        if (productData.stock < item.quantity) {
                            throw new Error(`Insufficient stock for ${item.productName}`);
                        }

                        // Update product stock
                        transaction.update(productRef, {
                            stock: productData.stock - item.quantity,
                            updatedAt: serverTimestamp()
                        });

                        // Create stock log
                        const stockLogRef = doc(collection(db, 'stock_logs'));
                        transaction.set(stockLogRef, {
                            businessId,
                            productId: item.productId,
                            type: 'out',
                            quantity: item.quantity,
                            reason: 'Bulk order sale',
                            previousStock: productData.stock,
                            newStock: productData.stock - item.quantity,
                            createdBy: currentUser.uid,
                            createdAt: serverTimestamp()
                        });
                    }

                    // Calculate totals
                    const itemSubtotals = orderData.items.reduce((sum, item) => sum + item.total, 0);
                    const totalDiscount = orderData.items.reduce((sum, item) => sum + (item.discount || 0), 0);
                    const total = Math.max(0, itemSubtotals - totalDiscount);

                    // Create order
                    const orderRef = doc(collection(db, 'orders'));
                    transaction.set(orderRef, {
                        businessId,
                        orderNumber: generateOrderNumber(),
                        customerName: orderData.customerName,
                        customerPhone: orderData.customerPhone,
                        customerEmail: orderData.customerEmail,
                        items: orderData.items.map(({ discount, ...item }) => item), // Remove discount from individual items
                        subtotal: itemSubtotals,
                        discount: totalDiscount,
                        total: total,
                        status: 'pending',
                        paymentStatus: 'unpaid',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                });
            }

            const orderCount = Object.keys(ordersByCustomer).length;
            setSuccess(`Successfully created ${orderCount} order(s) from ${rows.length} item(s)!`);

            // Reset to single empty row
            setRows([{ ...emptyRow, id: Date.now() }]);

            // Refresh products to get updated stock
            await fetchProducts();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error creating orders:', error);
            setError(error.message || 'Failed to create orders. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bulk Create Orders</h1>
                    <p className="text-gray-500 mt-1">Add multiple orders at once. Orders with the same customer will be grouped together.</p>
                </div>
                <button
                    onClick={addRow}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    Add Row
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{success}</p>
                    <button onClick={() => setSuccess('')} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Multiple items with the same customer name will be combined into a single order. Leave customer details the same for items that belong to the same order.
                </p>
            </div>

            {/* Table Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">#</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer Name *</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Product *</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Quantity *</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Discount ($)</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total</th>
                                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, index) => {
                                const rowTotal = calculateRowTotal(row);
                                const selectedProduct = products.find(p => p.id === row.productId);

                                return (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">{index + 1}</td>

                                        {/* Customer Name */}
                                        <td className="px-3 py-2">
                                            <input
                                                type="text"
                                                value={row.customerName}
                                                onChange={(e) => updateRow(row.id, 'customerName', e.target.value)}
                                                className={`w-48 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-violet-100 ${row.errors?.customerName ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                    }`}
                                                placeholder="John Doe"
                                            />
                                            {row.errors?.customerName && (
                                                <p className="text-xs text-red-600 mt-0.5">{row.errors.customerName}</p>
                                            )}
                                        </td>

                                        {/* Phone */}
                                        <td className="px-3 py-2">
                                            <input
                                                type="tel"
                                                value={row.customerPhone}
                                                onChange={(e) => updateRow(row.id, 'customerPhone', e.target.value)}
                                                className="w-36 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100"
                                                placeholder="+1 234 567 890"
                                            />
                                        </td>

                                        {/* Email */}
                                        <td className="px-3 py-2">
                                            <input
                                                type="email"
                                                value={row.customerEmail}
                                                onChange={(e) => updateRow(row.id, 'customerEmail', e.target.value)}
                                                className="w-48 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100"
                                                placeholder="john@example.com"
                                            />
                                        </td>

                                        {/* Product */}
                                        <td className="px-3 py-2">
                                            <select
                                                value={row.productId}
                                                onChange={(e) => updateRow(row.id, 'productId', e.target.value)}
                                                className={`w-64 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-violet-100 ${row.errors?.productId ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                    }`}
                                            >
                                                <option value="">Select product</option>
                                                {products.filter(p => p.stock > 0).map(product => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name} - ${product.price.toFixed(2)} (Stock: {product.stock})
                                                    </option>
                                                ))}
                                            </select>
                                            {row.errors?.productId && (
                                                <p className="text-xs text-red-600 mt-0.5">{row.errors.productId}</p>
                                            )}
                                        </td>

                                        {/* Quantity */}
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                min="1"
                                                max={selectedProduct?.stock || 999}
                                                value={row.quantity}
                                                onChange={(e) => updateRow(row.id, 'quantity', e.target.value)}
                                                className={`w-20 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-violet-100 ${row.errors?.quantity ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                    }`}
                                                placeholder="1"
                                            />
                                            {row.errors?.quantity && (
                                                <p className="text-xs text-red-600 mt-0.5">{row.errors.quantity}</p>
                                            )}
                                        </td>

                                        {/* Discount */}
                                        <td className="px-3 py-2">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={row.discount}
                                                onChange={(e) => updateRow(row.id, 'discount', e.target.value)}
                                                className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100"
                                                placeholder="0.00"
                                            />
                                        </td>

                                        {/* Total */}
                                        <td className="px-3 py-2">
                                            <span className="font-medium text-gray-900">
                                                ${rowTotal.toFixed(2)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-3 py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => removeRow(row.id)}
                                                disabled={rows.length === 1}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{rows.length}</span> item{rows.length !== 1 ? 's' : ''} ready to process
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={addRow}
                            className="px-4 py-2 text-sm border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Add Another Row
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Create All Orders
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
