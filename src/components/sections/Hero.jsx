import React from 'react';
import { ArrowRight, BarChart2, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
    return (
        <div className="relative overflow-hidden bg-white pt-16">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[30%] -right-[10%] w-[70rem] h-[70rem] bg-gradient-to-br from-primary-100/40 to-transparent rounded-full blur-3xl" />
                <div className="absolute top-[40%] -left-[10%] w-[40rem] h-[40rem] bg-gradient-to-tr from-blue-100/40 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative z-10">
                <div className="text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm font-semibold mb-6 border border-primary-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </span>
                            New Generation Inventory System
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
                            Manage Items with <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">
                                Absolute Precision
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl lg:max-w-none mx-auto lg:mx-0">
                            Streamline your workflow, track products in real-time, and boost efficiency with our premium inventory solution designed for modern businesses.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link to="/login" className="inline-flex justify-center items-center px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-500/30 gap-2 group">
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/about" className="inline-flex justify-center items-center px-8 py-3 rounded-lg bg-white text-gray-700 font-semibold border border-gray-200 hover:bg-gray-50 transition-all hover:border-gray-300 shadow-sm">
                                Learn More
                            </Link>
                        </div>

                        <div className="mt-12 grid grid-cols-3 gap-6 border-t border-gray-100 pt-8">
                            <div>
                                <div className="font-bold text-3xl text-gray-900">99%</div>
                                <div className="text-sm text-gray-500">Accuracy</div>
                            </div>
                            <div>
                                <div className="font-bold text-3xl text-gray-900">24/7</div>
                                <div className="text-sm text-gray-500">Monitoring</div>
                            </div>
                            <div>
                                <div className="font-bold text-3xl text-gray-900">10k+</div>
                                <div className="text-sm text-gray-500">Users</div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Image/Visual */}
                    <div className="hidden lg:block relative">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 bg-white/50 backdrop-blur-sm p-4">
                            {/* Decorative elements simulating a dashboard interface */}
                            <div className="bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden aspect-[4/3] relative">
                                <div className="absolute top-0 w-full h-12 bg-gray-50 border-b border-gray-100 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div className="h-8 w-1/3 bg-gray-100 rounded animate-pulse"></div>
                                        <div className="h-8 w-24 bg-primary-100 rounded animate-pulse"></div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="h-32 bg-gray-50 rounded border border-gray-100 p-4 flex flex-col justify-center items-center">
                                            <BarChart2 className="w-8 h-8 text-primary-500 mb-2 opacity-50" />
                                            <div className="h-2 w-16 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="h-32 bg-gray-50 rounded border border-gray-100 p-4 flex flex-col justify-center items-center">
                                            <Shield className="w-8 h-8 text-green-500 mb-2 opacity-50" />
                                            <div className="h-2 w-16 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="h-32 bg-gray-50 rounded border border-gray-100 p-4 flex flex-col justify-center items-center">
                                            <Zap className="w-8 h-8 text-yellow-500 mb-2 opacity-50" />
                                            <div className="h-2 w-16 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 w-full bg-gray-100 rounded"></div>
                                        <div className="h-4 w-5/6 bg-gray-100 rounded"></div>
                                        <div className="h-4 w-4/6 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating cards */}
                        <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3 animate-bounce shadow-primary-500/10" style={{ animationDuration: '3s' }}>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <Shield size={24} />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Secure Data</div>
                                <div className="text-xs text-gray-500">Enterprise Grade</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
