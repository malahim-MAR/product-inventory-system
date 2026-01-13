import React, { useState, useEffect } from 'react';
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
    ArrowRight,
    Loader2
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function Overview() {
    const { businessId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalStock: 0,
        todaySales: 0,
        todayOrders: 0
    });
    const [lowStockProducts, setLowStockProducts] = useState([]);

    useEffect(() => {
        if (businessId) {
            fetchDashboardData();
        }
    }, [businessId]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Get start of today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            // Fetch products
            const productsRef = collection(db, 'products');
            const productsQuery = query(productsRef, where('businessId', '==', businessId));
            const productsSnap = await getDocs(productsQuery);

            let totalProducts = 0;
            let totalStock = 0;
            const lowStock = [];

            productsSnap.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                totalProducts++;
                totalStock += product.stock || 0;

                // Check for low stock
                if (product.stock <= (product.lowStockThreshold || 10)) {
                    lowStock.push(product);
                }
            });

            // Fetch today's orders
            const ordersRef = collection(db, 'orders');
            const ordersQuery = query(
                ordersRef,
                where('businessId', '==', businessId),
                where('createdAt', '>=', todayTimestamp)
            );
            const ordersSnap = await getDocs(ordersQuery);

            let todaySales = 0;
            let todayOrders = 0;

            ordersSnap.forEach((doc) => {
                const order = doc.data();
                todayOrders++;
                todaySales += order.total || 0;
            });

            setStats({
                totalProducts,
                totalStock,
                todaySales,
                todayOrders
            });

            // Sort low stock by stock level and limit to 5
            setLowStockProducts(
                lowStock
                    .sort((a, b) => a.stock - b.stock)
                    .slice(0, 5)
            );

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Products',
            value: stats.totalProducts,
            icon: Package,
            color: 'violet',
            bgColor: 'bg-violet-50',
            iconColor: 'text-violet-600',
            borderColor: 'border-violet-100'
        },
        {
            label: 'Total Stock Units',
            value: stats.totalStock.toLocaleString(),
            icon: Boxes,
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            borderColor: 'border-blue-100'
        },
        {
            label: "Today's Sales",
            value: `$${stats.todaySales.toLocaleString()}`,
            icon: DollarSign,
            color: 'emerald',
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            borderColor: 'border-emerald-100'
        },
        {
            label: "Today's Orders",
            value: stats.todayOrders,
            icon: ShoppingCart,
            color: 'amber',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600',
            borderColor: 'border-amber-100'
        },
    ];

    const quickActions = [
        { label: 'Add Product', icon: Plus, path: '/dashboard/products', color: 'violet' },
        { label: 'Add Order', icon: ShoppingCart, path: '/dashboard/orders', color: 'blue' },
        { label: 'Share Catalog', icon: Share2, path: '/dashboard/catalog', color: 'emerald' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your business today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className={`bg-white p-5 lg:p-6 rounded-xl border ${stat.borderColor} shadow-sm hover:shadow-md transition-all duration-300`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
                            <div className={`w-10 h-10 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <div className="text-2xl lg:text-3xl font-bold text-gray-900">{stat.value}</div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-emerald-600 font-medium">
                            <TrendingUp className="w-3 h-3" />
                            <span>Updated just now</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions & Low Stock Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {/* Quick Actions */}
                <div className="bg-white p-5 lg:p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        {quickActions.map((action, index) => (
                            <Link
                                key={index}
                                to={action.path}
                                className={`
                  flex items-center justify-between p-4 rounded-lg border border-gray-100
                  hover:border-${action.color}-200 hover:bg-${action.color}-50/50
                  transition-all duration-200 group
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    bg-gradient-to-br from-${action.color}-500 to-${action.color}-600
                    text-white shadow-sm
                  `}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-gray-700">{action.label}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="lg:col-span-2 bg-white p-5 lg:p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h3 className="font-semibold text-gray-800">Low Stock Alerts</h3>
                        </div>
                        {lowStockProducts.length > 0 && (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                {lowStockProducts.length} items
                            </span>
                        )}
                    </div>

                    {lowStockProducts.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Package className="w-8 h-8 text-emerald-500" />
                            </div>
                            <p className="text-gray-500">All products are well stocked!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg border border-amber-200 flex items-center justify-center">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-8 h-8 object-cover rounded"
                                                />
                                            ) : (
                                                <Package className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-amber-600">{product.stock} left</p>
                                        <p className="text-xs text-gray-500">Min: {product.lowStockThreshold || 10}</p>
                                    </div>
                                </div>
                            ))}

                            <Link
                                to="/dashboard/products"
                                className="block text-center py-3 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                            >
                                View all products →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
