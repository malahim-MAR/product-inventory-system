import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function PricingSection() {
    const [isYearly, setIsYearly] = useState(false);

    const plans = [
        {
            name: "Starter",
            price: isYearly ? 290 : 29,
            period: isYearly ? "/year" : "/mo",
            description: "Perfect for small businesses just starting out.",
            features: [
                "Up to 1,000 items",
                "Basic Reporting",
                "1 User Account",
                "24/7 Email Support"
            ],
            notIncluded: [
                "API Access",
                "Multiple Warehouse",
                "Predictive Analytics"
            ],
            cta: "Start Free Trial",
            popular: false
        },
        {
            name: "Professional",
            price: isYearly ? 790 : 79,
            period: isYearly ? "/year" : "/mo",
            description: "Ideal for growing businesses with scaling needs.",
            features: [
                "Unlimited items",
                "Advanced Analytics",
                "5 User Accounts",
                "Priority Support",
                "Multiple Warehouse"
            ],
            notIncluded: [
                "API Access",
                "Predictive Analytics"
            ],
            cta: "Get Started",
            popular: true
        },
        {
            name: "Enterprise",
            price: isYearly ? 1990 : 199,
            period: isYearly ? "/year" : "/mo",
            description: "For large scale organizations requiring full control.",
            features: [
                "Unlimited everything",
                "Custom Reporting",
                "Unlimited Users",
                "Dedicated Account Manager",
                "API Access",
                "Predictive Analytics"
            ],
            notIncluded: [],
            cta: "Contact Sales",
            popular: false
        }
    ];

    return (
        <section id="pricing" className="py-24 bg-gray-900 text-white relative overflow-hidden">
            {/* Background blobs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-base text-primary-400 font-semibold tracking-wide uppercase">Pricing</h2>
                    <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-white sm:text-4xl">
                        Simple, Transparent Pricing
                    </p>
                    <div className="mt-8 flex justify-center items-center gap-4">
                        <span className={cn("text-sm font-medium", !isYearly ? "text-white" : "text-gray-400")}>Monthly</span>
                        <button
                            onClick={() => setIsYearly(!isYearly)}
                            className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                        >
                            <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", isYearly ? "translate-x-6" : "translate-x-1")} />
                        </button>
                        <span className={cn("text-sm font-medium", isYearly ? "text-white" : "text-gray-400")}>Yearly <span className="text-primary-400 text-xs">(Save 20%)</span></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <div key={index} className={cn(
                            "relative rounded-2xl p-8 border flex flex-col",
                            plan.popular
                                ? "bg-gray-800 border-primary-500 shadow-xl shadow-primary-500/10 scale-105"
                                : "bg-gray-800/50 border-gray-700 hover:bg-gray-800 transition-colors"
                        )}>
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline mb-4">
                                <span className="text-4xl font-extrabold tracking-tight text-white">${plan.price}</span>
                                <span className="text-gray-400 ml-1">{plan.period}</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-6 pb-6 border-b border-gray-700">{plan.description}</p>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start text-sm text-gray-300">
                                        <Check className="w-5 h-5 text-green-400 mr-2 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                                {plan.notIncluded.map((feature, i) => (
                                    <li key={i} className="flex items-start text-sm text-gray-500">
                                        <X className="w-5 h-5 text-gray-600 mr-2 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button className={cn(
                                "w-full py-3 rounded-lg font-semibold transition-all shadow-md mt-auto",
                                plan.popular
                                    ? "bg-primary-500 hover:bg-primary-600 text-white shadow-primary-500/25"
                                    : "bg-white text-gray-900 hover:bg-gray-100"
                            )}>
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
