import React from 'react';
import { Target, Users, TrendingUp } from 'lucide-react';

export default function AboutSection() {
    const cards = [
        {
            icon: <Target className="w-8 h-8 text-primary-600" />,
            title: "Our Mission",
            description: "To simplify inventory management for businesses of all sizes through intuitive, powerful software."
        },
        {
            icon: <Users className="w-8 h-8 text-primary-600" />,
            title: "Who We Are",
            description: "A team of dedicated engineers and designers passionate about solving complex logistic problems."
        },
        {
            icon: <TrendingUp className="w-8 h-8 text-primary-600" />,
            title: "Our Vision",
            description: "Becoming the global standard for product tracking and inventory optimization."
        }
    ];

    return (
        <section id="about" className="py-24 bg-gray-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white to-transparent opacity-50" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">About Us</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                        Building the Future of Inventory
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                        We combine decades of industry experience with cutting-edge technology to deliver a superior product.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {cards.map((card, index) => (
                        <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col items-start group">
                            <div className="p-3 bg-primary-50 rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300">
                                {card.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">{card.title}</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {card.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
