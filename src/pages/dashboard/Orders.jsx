import React, { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Plus,
    Search,
    Eye,
    X,
    Loader2,
    AlertCircle,
    Trash2,
    Check,
    Clock,
    Truck,
    PackageCheck,
    XCircle
} from 'lucide-react';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy,
    runTransaction
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

const ORDER_STATUSES = [
    { value: 'pending', label: 'Pending', color: 'amber', icon: Clock },
    { value: 'confirmed', label: 'Confirmed', color: 'blue', icon: Check },
    { value: 'shipped', label: 'Shipped', color: 'purple', icon: Truck },
    { value: 'delivered', label: 'Delivered', color: 'emerald', icon: PackageCheck },
    { value: 'cancelled', label: 'Cancelled', color: 'red', icon: XCircle },
];

const PAYMENT_STATUSES = [
    { value: 'unpaid', label: 'Unpaid', color: 'red' },
    { value: 'paid', label: 'Paid', color: 'emerald' },
    { value: 'refunded', label: 'Refunded', color: 'gray' },
];

export default function Orders() {
    const { businessId, currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        discount: '0'
    });
    const [orderItems, setOrderItems] = useState([]);

    useEffect(() => {
        if (businessId) {
            fetchOrders();
            fetchProducts();
        }
    }, [businessId]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const ordersRef = collection(db, 'orders');

            let ordersData = [];

            try {
                // Try ordered query first (requires composite index)
                const q = query(
                    ordersRef,
                    where('businessId', '==', businessId),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(q);
                ordersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            } catch (indexError) {
                // Fallback: simple query without orderBy (if index not created yet)
                console.warn('Firestore index required. Using fallback query. Create index at:', indexError.message);
                const q = query(ordersRef, where('businessId', '==', businessId));
                const snapshot = await getDocs(q);
                ordersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Sort client-side as fallback
                ordersData.sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB - dateA;
                });
            }

            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('businessId', '==', businessId));
            const snapshot = await getDocs(q);

            setProducts(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const generateOrderNumber = () => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${year}${month}${day}-${random}`;
    };

    const handleAddItem = () => {
        setOrderItems([...orderItems, { productId: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index) => {
        setOrderItems(orderItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...orderItems];
        newItems[index][field] = value;
        setOrderItems(newItems);
    };

    const calculateTotals = () => {
        const subtotal = orderItems.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return sum;
            return sum + (product.price * (parseInt(item.quantity) || 0));
        }, 0);

        const discount = parseFloat(formData.discount) || 0;
        const total = Math.max(0, subtotal - discount);

        return { subtotal, discount, total };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (orderItems.length === 0) {
            setError('Please add at least one item to the order');
            return;
        }

        // Check for valid items
        const validItems = orderItems.filter(item => item.productId && item.quantity > 0);
        if (validItems.length === 0) {
            setError('Please select products and quantities');
            return;
        }

        setSaving(true);

        try {
            const { subtotal, discount, total } = calculateTotals();

            // Build items array with product details
            const items = validItems.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    productId: item.productId,
                    productName: product.name,
                    quantity: parseInt(item.quantity),
                    unitPrice: product.price,
                    total: product.price * parseInt(item.quantity)
                };
            });

            // Use transaction to update stock and create order
            await runTransaction(db, async (transaction) => {
                // Check and update stock for each product
                for (const item of items) {
                    const productRef = doc(db, 'products', item.productId);
                    const product = products.find(p => p.id === item.productId);

                    if (product.stock < item.quantity) {
                        throw new Error(`Insufficient stock for ${product.name}`);
                    }

                    // Update product stock
                    transaction.update(productRef, {
                        stock: product.stock - item.quantity,
                        updatedAt: serverTimestamp()
                    });

                    // Create stock log
                    const stockLogRef = doc(collection(db, 'stock_logs'));
                    transaction.set(stockLogRef, {
                        businessId,
                        productId: item.productId,
                        type: 'out',
                        quantity: item.quantity,
                        reason: 'Order sale',
                        previousStock: product.stock,
                        newStock: product.stock - item.quantity,
                        createdBy: currentUser.uid,
                        createdAt: serverTimestamp()
                    });
                }

                // Create order
                const orderRef = doc(collection(db, 'orders'));
                transaction.set(orderRef, {
                    businessId,
                    orderNumber: generateOrderNumber(),
                    customerName: formData.customerName,
                    customerPhone: formData.customerPhone,
                    customerEmail: formData.customerEmail,
                    items,
                    subtotal,
                    discount,
                    total,
                    status: 'pending',
                    paymentStatus: 'unpaid',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            // Reset and refresh
            resetForm();
            fetchOrders();
            fetchProducts();
        } catch (error) {
            console.error('Error creating order:', error);
            setError(error.message || 'Failed to create order');
        } finally {
            setSaving(false);
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), {
                status,
                updatedAt: serverTimestamp()
            });
            fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    const updatePaymentStatus = async (orderId, paymentStatus) => {
        try {
            await updateDoc(doc(db, 'orders', orderId), {
                paymentStatus,
                updatedAt: serverTimestamp()
            });
            fetchOrders();
        } catch (error) {
            console.error('Error updating payment status:', error);
        }
    };

    const deleteOrder = async (orderId) => {
        if (!confirm('Are you sure you want to delete this order?')) return;

        try {
            await deleteDoc(doc(db, 'orders', orderId));
            fetchOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            customerName: '',
            customerPhone: '',
            customerEmail: '',
            discount: '0'
        });
        setOrderItems([]);
        setShowModal(false);
        setError('');
    };

    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    const filteredOrders = orders.filter(order =>
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusInfo = (status) => ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
    const getPaymentInfo = (status) => PAYMENT_STATUSES.find(s => s.value === status) || PAYMENT_STATUSES[0];

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const { subtotal, total } = calculateTotals();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Orders</h1>
                    <p className="text-gray-500 mt-1">Manage customer orders</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    New Order
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search by order number or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                />
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try a different search term' : 'Create your first order'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        const paymentInfo = getPaymentInfo(order.paymentStatus);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 lg:p-6"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    {/* Order Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusInfo.label}
                                            </span>
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-${paymentInfo.color}-100 text-${paymentInfo.color}-700`}>
                                                {paymentInfo.label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">{order.customerName}</span>
                                            {order.customerPhone && <span className="ml-2 text-gray-400">• {order.customerPhone}</span>}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                                    </div>

                                    {/* Order Amount */}
                                    <div className="flex items-center justify-between lg:justify-end gap-4">
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-gray-900">${order.total?.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">{order.items?.length || 0} items</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => viewOrderDetails(order)}
                                                className="p-2 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteOrder(order.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* New Order Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">New Order</h2>
                            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-lg text-red-700">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}

                            {/* Customer Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                                    <input
                                        type="text"
                                        value={formData.customerName}
                                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        required
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.customerPhone}
                                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.customerEmail}
                                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-700">Order Items *</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                                    >
                                        + Add Item
                                    </button>
                                </div>

                                {orderItems.length === 0 ? (
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="w-full py-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-colors"
                                    >
                                        Click to add items
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        {orderItems.map((item, index) => {
                                            const selectedProduct = products.find(p => p.id === item.productId);
                                            return (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                    <select
                                                        value={item.productId}
                                                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                                                    >
                                                        <option value="">Select product</option>
                                                        {products.filter(p => p.stock > 0).map(product => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.name} - ${product.price} (Stock: {product.stock})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        min="1"
                                                        max={selectedProduct?.stock || 999}
                                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-100"
                                                    />
                                                    <span className="w-24 text-right font-medium text-gray-900">
                                                        ${selectedProduct ? (selectedProduct.price * (parseInt(item.quantity) || 0)).toFixed(2) : '0.00'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-1 text-gray-400 hover:text-red-500"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Discount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                                <input
                                    type="number"
                                    value={formData.discount}
                                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                                />
                            </div>

                            {/* Totals */}
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Discount</span>
                                    <span className="font-medium text-red-600">-${(parseFloat(formData.discount) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-bold text-violet-600">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {showDetailsModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Order Header */}
                            <div>
                                <p className="font-semibold text-lg text-gray-900">{selectedOrder.orderNumber}</p>
                                <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                            </div>

                            {/* Status Controls */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                                    >
                                        {ORDER_STATUSES.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                    <select
                                        value={selectedOrder.paymentStatus}
                                        onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                                    >
                                        {PAYMENT_STATUSES.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm font-medium text-gray-900 mb-2">Customer</p>
                                <p className="text-sm text-gray-600">{selectedOrder.customerName}</p>
                                {selectedOrder.customerPhone && (
                                    <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>
                                )}
                                {selectedOrder.customerEmail && (
                                    <p className="text-sm text-gray-500">{selectedOrder.customerEmail}</p>
                                )}
                            </div>

                            {/* Items */}
                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-2">Items</p>
                                <div className="space-y-2">
                                    {selectedOrder.items?.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.productName}</p>
                                                <p className="text-gray-500">{item.quantity} x ${item.unitPrice?.toFixed(2)}</p>
                                            </div>
                                            <p className="font-medium">${item.total?.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                                </div>
                                {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Discount</span>
                                        <span className="text-red-600">-${selectedOrder.discount?.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                                    <span>Total</span>
                                    <span className="text-violet-600">${selectedOrder.total?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
