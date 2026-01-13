import React from 'react';
import ServicesSection from '../components/sections/ServicesSection';

export default function Services() {
    return (
        <div className="pt-16">
            <div className="bg-gray-900 text-white py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">Our Services</h1>
                <p className="max-w-xl mx-auto text-gray-400">Discover the tools and features we offer to help your business thrive.</p>
            </div>
            <ServicesSection />
        </div>
    );
}
