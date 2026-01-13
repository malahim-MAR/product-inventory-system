import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, ShoppingCart, Activity, Bell, Search, Settings, LogOut } from 'lucide-react';

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-gray-800">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl">
                            M
                        </div>
                        <span className="text-xl font-bold text-white">
                            Malahim
                        </span>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <a href="#" className="flex items-center gap-3 px-4 py-3 bg-primary-600 rounded-lg text-white font-medium">
                        <Activity className="w-5 h-5" /> Dashboard
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        <Package className="w-5 h-5" /> Inventory
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        <Users className="w-5 h-5" /> Customers
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        <ShoppingCart className="w-5 h-5" /> Orders
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-medium transition-colors">
                        <Settings className="w-5 h-5" /> Settings
                    </a>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <Link to="/login" className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg font-medium transition-colors">
                        <LogOut className="w-5 h-5" /> Sign Out
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <h1 className="text-xl font-semibold text-gray-800">Dashboard Overview</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400 w-64 transition-all"
                            />
                        </div>
                        <button className="relative p-2 text-gray-400 hover:text-gray-600">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                            JD
                        </div>
                    </div>
                </header>

                {/* Body */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { label: "Total Revenue", value: "$45,231.89", change: "+20.1%", icon: <Activity className="text-green-600" /> },
                            { label: "Active Orders", value: "+2350", change: "+180.1%", icon: <ShoppingCart className="text-blue-600" /> },
                            { label: "Products", value: "12,234", change: "+19.0%", icon: <Package className="text-purple-600" /> },
                            { label: "Customers", value: "+573", change: "+201 since last hour", icon: <Users className="text-orange-600" /> }
                        ].map((stat, index) => (
                            <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-500 text-sm font-medium">{stat.label}</span>
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                <div className="text-xs text-green-600 font-medium">{stat.change}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Placeholder Charts/Tables */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
                            <h3 className="font-semibold text-gray-800 mb-4">Recent Sales</h3>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">Product Item #{i}</div>
                                                <div className="text-xs text-gray-500">2 minutes ago</div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">+$120.00</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
                            <h3 className="font-semibold text-gray-800 mb-4">Inventory Alerts</h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-start gap-4 p-4 border border-red-100 bg-red-50/50 rounded-lg">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-red-400 shrink-0" />
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">Low Stock Alert</div>
                                            <p className="text-xs text-gray-600 mt-1">Item #493 is below threshold. Only 5 units remaining.</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
