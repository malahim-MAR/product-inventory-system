import React, { useState, useEffect } from 'react';
import {
    Package,
    Plus,
    Trash2,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle,
    Upload,
    X
} from 'lucide-react';
import {
    collection,
    addDoc,
    serverTimestamp,
    writeBatch,
    doc
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

const emptyRow = {
    name: '',
    description: '',
    sku: '',
    price: '',
    costPrice: '',
    stock: '',
    lowStockThreshold: '10',
    category: '',
    isActive: true,
    errors: {}
};

export default function BulkProducts() {
    const { businessId } = useAuth();
    const [rows, setRows] = useState([{ ...emptyRow, id: Date.now() }]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

    const validateRow = (row) => {
        const errors = {};

        if (!row.name?.trim()) {
            errors.name = 'Required';
        }

        if (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) < 0) {
            errors.price = 'Invalid price';
        }

        if (!row.stock || isNaN(parseInt(row.stock)) || parseInt(row.stock) < 0) {
            errors.stock = 'Invalid stock';
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
            const batch = writeBatch(db);

            rows.forEach((row) => {
                const productRef = doc(collection(db, 'products'));
                batch.set(productRef, {
                    businessId,
                    name: row.name.trim(),
                    description: row.description?.trim() || '',
                    sku: row.sku?.trim() || '',
                    price: parseFloat(row.price) || 0,
                    costPrice: parseFloat(row.costPrice) || 0,
                    stock: parseInt(row.stock) || 0,
                    lowStockThreshold: parseInt(row.lowStockThreshold) || 10,
                    category: row.category?.trim() || '',
                    imageUrl: '',
                    isActive: row.isActive,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();

            setSuccess(`Successfully added ${rows.length} product(s)!`);
            // Reset to single empty row
            setRows([{ ...emptyRow, id: Date.now() }]);

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error('Error saving products:', error);
            setError('Failed to save products. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Bulk Add Products</h1>
                    <p className="text-gray-500 mt-1">Add multiple products at once using this spreadsheet-style interface</p>
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

            {/* Table Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">#</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Name *</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Description</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">SKU</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Price ($) *</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Cost Price ($)</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock *</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Low Stock Alert</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Active</th>
                                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, index) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2 text-sm text-gray-500 whitespace-nowrap">{index + 1}</td>

                                    {/* Name */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={row.name}
                                            onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                                            className={`w-48 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-violet-100 ${row.errors?.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                            placeholder="Product name"
                                        />
                                        {row.errors?.name && (
                                            <p className="text-xs text-red-600 mt-0.5">{row.errors.name}</p>
                                        )}
                                    </td>

                                    {/* Description */}
                                    <td className="px-3 py-2">
                                        <textarea
                                            value={row.description}
                                            onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                                            rows={2}
                                            className="w-56 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100 resize-none"
                                            placeholder="Description (optional)"
                                        />
                                    </td>

                                    {/* SKU */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={row.sku}
                                            onChange={(e) => updateRow(row.id, 'sku', e.target.value)}
                                            className="w-28 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100"
                                            placeholder="SKU-001"
                                        />
                                    </td>

                                    {/* Price */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.price}
                                            onChange={(e) => updateRow(row.id, 'price', e.target.value)}
                                            className={`w-24 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-violet-100 ${row.errors?.price ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                            placeholder="0.00"
                                        />
                                        {row.errors?.price && (
                                            <p className="text-xs text-red-600 mt-0.5">{row.errors.price}</p>
                                        )}
                                    </td>

                                    {/* Cost Price */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.costPrice}
                                            onChange={(e) => updateRow(row.id, 'costPrice', e.target.value)}
                                            className="w-24 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100"
                                            placeholder="0.00"
                                        />
                                    </td>

                                    {/* Stock */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            value={row.stock}
                                            onChange={(e) => updateRow(row.id, 'stock', e.target.value)}
                                            className={`w-20 px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-violet-100 ${row.errors?.stock ? 'border-red-300 bg-red-50' : 'border-gray-200'
                                                }`}
                                            placeholder="0"
                                        />
                                        {row.errors?.stock && (
                                            <p className="text-xs text-red-600 mt-0.5">{row.errors.stock}</p>
                                        )}
                                    </td>

                                    {/* Low Stock Threshold */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            value={row.lowStockThreshold}
                                            onChange={(e) => updateRow(row.id, 'lowStockThreshold', e.target.value)}
                                            className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100"
                                            placeholder="10"
                                        />
                                    </td>

                                    {/* Category */}
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            value={row.category}
                                            onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                                            className="w-32 px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-violet-100"
                                            placeholder="Category"
                                        />
                                    </td>

                                    {/* Active */}
                                    <td className="px-3 py-2 text-center">
                                        <input
                                            type="checkbox"
                                            checked={row.isActive}
                                            onChange={(e) => updateRow(row.id, 'isActive', e.target.checked)}
                                            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                                        />
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{rows.length}</span> row{rows.length !== 1 ? 's' : ''} ready to upload
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
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload All Products
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
