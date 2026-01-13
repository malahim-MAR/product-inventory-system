import React, { useState, useEffect } from 'react';
import {
    History,
    Package,
    ArrowUp,
    ArrowDown,
    Search,
    Loader2,
    Calendar,
    Filter,
    Download,
    User,
    ShoppingCart,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function StockHistory() {
    const { businessId } = useAuth();
    const [stockLogs, setStockLogs] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [dateFilter, setDateFilter] = useState('allTime');
    const [selectedProduct, setSelectedProduct] = useState('all');

    useEffect(() => {
        if (businessId) {
            fetchData();
        }
    }, [businessId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch products
            const productsRef = collection(db, 'products');
            const productsQuery = query(productsRef, where('businessId', '==', businessId));
            const productsSnap = await getDocs(productsQuery);
            const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(productsData);

            // Fetch stock logs
            const logsRef = collection(db, 'stock_logs');
            const logsQuery = query(logsRef, where('businessId', '==', businessId));
            const logsSnap = await getDocs(logsQuery);

            const logsData = logsSnap.docs.map(doc => {
                const data = doc.data();
                const product = productsData.find(p => p.id === data.productId);
                return {
                    id: doc.id,
                    ...data,
                    productName: product?.name || 'Unknown Product'
                };
            });

            // Sort by date (most recent first)
            logsData.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(0);
                const dateB = b.createdAt?.toDate?.() || new Date(0);
                return dateB - dateA;
            });

            setStockLogs(logsData);
        } catch (error) {
            console.error('Error fetching stock history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDateRange = (filter) => {
        const now = new Date();
        switch (filter) {
            case 'today':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate());
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getFullYear(), now.getMonth(), 1);
            case 'year':
                return new Date(now.getFullYear(), 0, 1);
            default:
                return new Date(2020, 0, 1);
        }
    };

    const filteredLogs = stockLogs.filter(log => {
        // Search filter
        if (searchTerm && !log.productName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !log.reason?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Type filter
        if (filterType !== 'all' && log.type !== filterType) {
            return false;
        }

        // Product filter
        if (selectedProduct !== 'all' && log.productId !== selectedProduct) {
            return false;
        }

        // Date filter
        const startDate = getDateRange(dateFilter);
        const logDate = log.createdAt?.toDate?.() || new Date(0);
        if (logDate < startDate) {
            return false;
        }

        return true;
    });

    // Calculate stats
    const stats = {
        totalIn: filteredLogs.filter(l => l.type === 'in').reduce((sum, l) => sum + (l.quantity || 0), 0),
        totalOut: filteredLogs.filter(l => l.type === 'out').reduce((sum, l) => sum + (l.quantity || 0), 0),
        adjustments: filteredLogs.filter(l => l.type === 'adjustment').length,
        uniqueProducts: [...new Set(filteredLogs.map(l => l.productId))].length
    };

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

    const getTypeIcon = (type) => {
        switch (type) {
            case 'in':
                return <ArrowUp className="w-4 h-4 text-emerald-600" />;
            case 'out':
                return <ArrowDown className="w-4 h-4 text-red-600" />;
            default:
                return <Minus className="w-4 h-4 text-amber-600" />;
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'in':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'out':
                return 'bg-red-50 text-red-700 border-red-200';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    const exportCSV = () => {
        const headers = ['Date', 'Product', 'Type', 'Quantity', 'Previous Stock', 'New Stock', 'Reason'];
        const csvData = filteredLogs.map(log => {
            const date = log.createdAt?.toDate?.() || new Date();
            return [
                date.toLocaleDateString(),
                log.productName,
                log.type,
                log.quantity,
                log.previousStock,
                log.newStock,
                log.reason || ''
            ].join(',');
        });

        const csv = [headers.join(','), ...csvData].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stock-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Stock History</h1>
                    <p className="text-gray-500 mt-1">Track all inventory changes and adjustments</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={exportCSV}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">+{stats.totalIn}</p>
                            <p className="text-xs text-gray-500">Stock In</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">-{stats.totalOut}</p>
                            <p className="text-xs text-gray-500">Stock Out</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                            <History className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{filteredLogs.length}</p>
                            <p className="text-xs text-gray-500">Total Entries</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{stats.uniqueProducts}</p>
                            <p className="text-xs text-gray-500">Products Affected</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search product or reason..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                    >
                        <option value="all">All Types</option>
                        <option value="in">Stock In</option>
                        <option value="out">Stock Out</option>
                        <option value="adjustment">Adjustment</option>
                    </select>

                    {/* Product Filter */}
                    <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100 max-w-[200px]"
                    >
                        <option value="all">All Products</option>
                        {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                    </select>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                    >
                        <option value="allTime">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">Last 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>
            </div>

            {/* Stock Logs Table */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                    <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No stock history found</h3>
                    <p className="text-gray-500">
                        {searchTerm || filterType !== 'all' || selectedProduct !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Stock changes will appear here when orders are placed'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Change</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-gray-400" />
                                                <span className="font-medium text-gray-900">{log.productName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getTypeColor(log.type)}`}>
                                                {getTypeIcon(log.type)}
                                                {log.type === 'in' ? 'Stock In' : log.type === 'out' ? 'Stock Out' : 'Adjustment'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-semibold ${log.type === 'in' ? 'text-emerald-600' : log.type === 'out' ? 'text-red-600' : 'text-amber-600'}`}>
                                                {log.type === 'in' ? '+' : log.type === 'out' ? '-' : ''}{log.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <span className="text-gray-400">{log.previousStock}</span>
                                            <span className="mx-2">→</span>
                                            <span className="font-medium text-gray-900">{log.newStock}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                                            {log.reason || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
