import React from 'react';
import { Package, BarChart2, Smartphone, Globe, Lock, RefreshCw } from 'lucide-react';

export default function ServicesSection() {
    const services = [
        {
            icon: <Package className="w-6 h-6" />,
            title: "Inventory Tracking",
            description: "Real-time tracking of stock levels across multiple warehouses."
        },
        {
            icon: <BarChart2 className="w-6 h-6" />,
            title: "Advanced Analytics",
            description: "Gain insights with powerful reporting tools and predictive analytics."
        },
        {
            icon: <Smartphone className="w-6 h-6" />,
            title: "Mobile Management",
            description: "Manage your inventory on the go with our dedicated mobile app."
        },
        {
            icon: <Globe className="w-6 h-6" />,
            title: "Global Sync",
            description: "Synchronize data instantly across international branches."
        },
        {
            icon: <Lock className="w-6 h-6" />,
            title: "Secure Cloud",
            description: "Enterprise-grade security to keep your sensitive business data safe."
        },
        {
            icon: <RefreshCw className="w-6 h-6" />,
            title: "Auto Replenishment",
            description: "Automated ordering systems to prevent stockouts."
        }
    ];

    return (
        <section id="services" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Our Services</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Everything You Need to Succeed
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                        Comprehensive solutions tailored to streamline your improved operations.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <div key={index} className="relative group p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300 border border-gray-100 hover:border-gray-200">
                            <div className="absolute top-6 left-6 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                {service.icon}
                            </div>
                            <div className="mt-16">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                                <p className="text-gray-500">
                                    {service.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
