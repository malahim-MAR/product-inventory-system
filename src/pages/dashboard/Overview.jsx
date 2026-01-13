import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Package,
    Boxes,
    DollarSign,
    ShoppingCart,
    AlertTriangle,
    Plus,
    Share2,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Loader2,
    Calendar,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    BarChart3,
    PieChart,
    RefreshCw,
    ChevronDown,
    Clock,
    CheckCircle,
    XCircle,
    Truck
} from 'lucide-react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function Overview() {
    const { businessId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Date filter state
    const [dateFilter, setDateFilter] = useState('thisMonth');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Data states
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);

    // Stats
    const [stats, setStats] = useState({
        totalProducts: 0,
        activeProducts: 0,
        totalStock: 0,
        lowStockCount: 0,
        totalOrders: 0,
        totalSales: 0,
        avgOrderValue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0
    });

    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [monthlySales, setMonthlySales] = useState([]);

    // Date range calculation
    const getDateRange = (filter) => {
        const now = new Date();
        let start, end;

        switch (filter) {
            case 'today':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                break;
            case 'yesterday':
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
                break;
            case 'thisWeek':
                const dayOfWeek = now.getDay();
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
                end = now;
                break;
            case 'lastWeek':
                const lastWeekDay = now.getDay();
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lastWeekDay - 7);
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - lastWeekDay - 1, 23, 59, 59);
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = now;
                break;
            case 'lastMonth':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
                break;
            case 'thisYear':
                start = new Date(now.getFullYear(), 0, 1);
                end = now;
                break;
            case 'allTime':
                start = new Date(2020, 0, 1);
                end = now;
                break;
            case 'custom':
                start = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth(), 1);
                end = customEndDate ? new Date(customEndDate + 'T23:59:59') : now;
                break;
            default:
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = now;
        }

        return { start, end };
    };

    useEffect(() => {
        if (businessId) {
            fetchDashboardData();
        }
    }, [businessId, dateFilter, customStartDate, customEndDate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange(dateFilter);
            const startTimestamp = Timestamp.fromDate(start);
            const endTimestamp = Timestamp.fromDate(end);

            // Fetch all products
            const productsRef = collection(db, 'products');
            const productsQuery = query(productsRef, where('businessId', '==', businessId));
            const productsSnap = await getDocs(productsQuery);

            const productsData = [];
            let totalStock = 0;
            let activeProducts = 0;
            const lowStock = [];

            productsSnap.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                productsData.push(product);
                totalStock += product.stock || 0;
                if (product.isActive !== false) activeProducts++;
                if (product.stock <= (product.lowStockThreshold || 10)) {
                    lowStock.push(product);
                }
            });

            setProducts(productsData);
            setLowStockProducts(lowStock.sort((a, b) => a.stock - b.stock).slice(0, 5));

            // Fetch ALL orders for monthly breakdown
            const ordersRef = collection(db, 'orders');
            const allOrdersQuery = query(ordersRef, where('businessId', '==', businessId));
            const allOrdersSnap = await getDocs(allOrdersQuery);

            const allOrdersData = [];
            allOrdersSnap.forEach((doc) => {
                allOrdersData.push({ id: doc.id, ...doc.data() });
            });
            setAllOrders(allOrdersData);

            // Filter orders by date range
            const filteredOrders = allOrdersData.filter(order => {
                if (!order.createdAt) return false;
                const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                return orderDate >= start && orderDate <= end;
            });

            setOrders(filteredOrders);

            // Calculate stats for filtered period
            let totalSales = 0;
            let pendingOrders = 0;
            let completedOrders = 0;
            let cancelledOrders = 0;
            const productSalesMap = {};

            filteredOrders.forEach((order) => {
                totalSales += order.total || 0;

                if (order.status === 'pending' || order.status === 'confirmed') pendingOrders++;
                else if (order.status === 'delivered') completedOrders++;
                else if (order.status === 'cancelled') cancelledOrders++;

                // Track product sales
                order.items?.forEach(item => {
                    if (!productSalesMap[item.productId]) {
                        productSalesMap[item.productId] = {
                            productId: item.productId,
                            productName: item.productName,
                            totalQuantity: 0,
                            totalRevenue: 0
                        };
                    }
                    productSalesMap[item.productId].totalQuantity += item.quantity || 0;
                    productSalesMap[item.productId].totalRevenue += item.total || 0;
                });
            });

            // Top selling products
            const topProductsList = Object.values(productSalesMap)
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 5);
            setTopProducts(topProductsList);

            // Recent orders
            const recentOrdersList = [...filteredOrders]
                .sort((a, b) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(0);
                    const dateB = b.createdAt?.toDate?.() || new Date(0);
                    return dateB - dateA;
                })
                .slice(0, 5);
            setRecentOrders(recentOrdersList);

            // Calculate monthly sales breakdown (last 6 months)
            const monthlyData = [];
            for (let i = 5; i >= 0; i--) {
                const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
                const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0, 23, 59, 59);

                const monthOrders = allOrdersData.filter(order => {
                    if (!order.createdAt) return false;
                    const orderDate = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                    return orderDate >= monthStart && orderDate <= monthEnd;
                });

                const monthSales = monthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
                const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });

                monthlyData.push({
                    month: monthName,
                    sales: monthSales,
                    orders: monthOrders.length
                });
            }
            setMonthlySales(monthlyData);

            setStats({
                totalProducts: productsData.length,
                activeProducts,
                totalStock,
                lowStockCount: lowStock.length,
                totalOrders: filteredOrders.length,
                totalSales,
                avgOrderValue: filteredOrders.length > 0 ? totalSales / filteredOrders.length : 0,
                pendingOrders,
                completedOrders,
                cancelledOrders
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    // Export functions
    const exportToCSV = () => {
        const { start, end } = getDateRange(dateFilter);
        const headers = ['Order Number', 'Customer', 'Date', 'Items', 'Total', 'Status', 'Payment'];

        const csvData = orders.map(order => {
            const date = order.createdAt?.toDate?.() || new Date();
            return [
                order.orderNumber || '',
                order.customerName || '',
                date.toLocaleDateString(),
                order.items?.length || 0,
                `$${(order.total || 0).toFixed(2)}`,
                order.status || '',
                order.paymentStatus || ''
            ].join(',');
        });

        const csv = [headers.join(','), ...csvData].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        const { start, end } = getDateRange(dateFilter);

        // Create printable HTML content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sales Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #7c3aed; }
                    .header { margin-bottom: 20px; }
                    .stats { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
                    .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; min-width: 150px; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
                    .stat-label { font-size: 12px; color: #6b7280; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
                    th { background: #7c3aed; color: white; }
                    tr:nth-child(even) { background: #f9fafb; }
                    .footer { margin-top: 30px; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 Sales Report</h1>
                    <p>Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
                    <p>Generated: ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalOrders}</div>
                        <div class="stat-label">Total Orders</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$${stats.totalSales.toFixed(2)}</div>
                        <div class="stat-label">Total Sales</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$${stats.avgOrderValue.toFixed(2)}</div>
                        <div class="stat-label">Avg Order Value</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.completedOrders}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                </div>
                
                <h2>Orders Detail</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Order #</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => {
            const date = order.createdAt?.toDate?.() || new Date();
            return `
                                <tr>
                                    <td>${order.orderNumber || '-'}</td>
                                    <td>${order.customerName || '-'}</td>
                                    <td>${date.toLocaleDateString()}</td>
                                    <td>${order.items?.length || 0}</td>
                                    <td>$${(order.total || 0).toFixed(2)}</td>
                                    <td>${order.status || '-'}</td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Malahim Inventory System - Confidential Report</p>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const dateFilterOptions = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'thisWeek', label: 'This Week' },
        { value: 'lastWeek', label: 'Last Week' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'thisYear', label: 'This Year' },
        { value: 'allTime', label: 'All Time' },
        { value: 'custom', label: 'Custom Range' }
    ];

    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
            case 'confirmed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
            case 'shipped': return <Truck className="w-4 h-4 text-purple-500" />;
            case 'delivered': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Calculate max sales for chart
    const maxSales = Math.max(...monthlySales.map(m => m.sales), 1);

    if (loading && !refreshing) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header with Date Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Track your business performance and analytics</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Filter Dropdown */}
                    <div className="relative">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400 cursor-pointer"
                        >
                            {dateFilterOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Custom Date Range */}
                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-100"
                            />
                        </div>
                    )}

                    {/* Refresh Button */}
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative group">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors shadow-sm">
                            <Download className="w-4 h-4" />
                            Export
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <button
                                onClick={exportToCSV}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                Export to Excel/CSV
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4 text-red-600" />
                                Export to PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Products */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm font-medium">Total Products</span>
                        <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-violet-600" />
                        </div>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalProducts}</div>
                    <p className="text-xs text-gray-500 mt-1">{stats.activeProducts} active</p>
                </div>

                {/* Total Stock */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm font-medium">Total Stock</span>
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Boxes className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalStock.toLocaleString()}</div>
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {stats.lowStockCount} low stock
                    </p>
                </div>

                {/* Total Orders (filtered) */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm font-medium">Orders</span>
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalOrders}</div>
                    <p className="text-xs text-gray-500 mt-1">
                        {stats.pendingOrders} pending • {stats.completedOrders} completed
                    </p>
                </div>

                {/* Total Sales (filtered) */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-500 text-sm font-medium">Sales</span>
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                    <div className="text-2xl lg:text-3xl font-bold text-gray-900">${stats.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-gray-500 mt-1">
                        Avg: ${stats.avgOrderValue.toFixed(2)}/order
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Sales Chart */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-violet-600" />
                            <h3 className="font-semibold text-gray-800">Monthly Sales (Last 6 Months)</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {monthlySales.map((month, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <span className="w-12 text-sm text-gray-600 font-medium">{month.month}</span>
                                <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg transition-all duration-500"
                                        style={{ width: `${(month.sales / maxSales) * 100}%` }}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-600">
                                        ${month.sales.toLocaleString()}
                                    </span>
                                </div>
                                <span className="w-16 text-right text-xs text-gray-500">{month.orders} orders</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Order Status Breakdown */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-violet-600" />
                            <h3 className="font-semibold text-gray-800">Order Status Breakdown</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-sm text-amber-700 font-medium">Pending</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-800">{stats.pendingOrders}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm text-emerald-700 font-medium">Completed</span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-800">{stats.completedOrders}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                            <div className="flex items-center gap-2 mb-2">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-700 font-medium">Cancelled</span>
                            </div>
                            <p className="text-2xl font-bold text-red-800">{stats.cancelledOrders}</p>
                        </div>
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-700 font-medium">Avg Value</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-800">${stats.avgOrderValue.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Selling Products */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Top Selling Products</h3>
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    {topProducts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">No sales in this period</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.map((product, index) => (
                                <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">{product.productName}</p>
                                            <p className="text-xs text-gray-500">{product.totalQuantity} sold</p>
                                        </div>
                                    </div>
                                    <span className="font-semibold text-emerald-600">${product.totalRevenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-800">Recent Orders</h3>
                        <Link to="/dashboard/orders" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                            View all →
                        </Link>
                    </div>
                    {recentOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">No orders in this period</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Order</th>
                                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Total</th>
                                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-2 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                                            <td className="py-3 px-2 text-sm text-gray-600">{order.customerName}</td>
                                            <td className="py-3 px-2 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                                            <td className="py-3 px-2 text-sm font-semibold text-gray-900">${order.total?.toFixed(2)}</td>
                                            <td className="py-3 px-2">
                                                <span className="inline-flex items-center gap-1 text-xs font-medium capitalize">
                                                    {getStatusIcon(order.status)}
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                            <h3 className="font-semibold text-amber-800">Low Stock Alerts</h3>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-200 text-amber-800 text-xs font-medium rounded-full">
                            {lowStockProducts.length} items
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {lowStockProducts.map((product) => (
                            <div key={product.id} className="bg-white p-4 rounded-lg border border-amber-200">
                                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-lg font-bold text-amber-600">{product.stock} left</span>
                                    <span className="text-xs text-gray-400">Min: {product.lowStockThreshold || 10}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link
                        to="/dashboard/products"
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
                    >
                        Manage inventory <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                    to="/dashboard/products"
                    className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-200">
                            <Plus className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Add Product</p>
                            <p className="text-sm text-gray-500">Create new item</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link
                    to="/dashboard/orders"
                    className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">New Order</p>
                            <p className="text-sm text-gray-500">Create order</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </Link>
                <Link
                    to="/dashboard/catalog"
                    className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Share2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Share Catalog</p>
                            <p className="text-sm text-gray-500">Public link</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </Link>
            </div>
        </div>
    );
}
