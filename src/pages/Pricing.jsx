import React from 'react';
import PricingSection from '../components/sections/PricingSection';

export default function Pricing() {
    return (
        <div className="pt-16">
            <div className="bg-gray-50 text-gray-900 py-20 text-center border-b border-gray-200">
                <h1 className="text-4xl font-bold mb-4">Plans & Pricing</h1>
                <p className="max-w-xl mx-auto text-gray-600">Choose the perfect plan for your business needs. No hidden fees.</p>
            </div>
            <PricingSection />
        </div>
    );
}
