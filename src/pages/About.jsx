import React from 'react';
import AboutSection from '../components/sections/AboutSection';

export default function About() {
    return (
        <div className="pt-16">
            <div className="bg-primary-900 text-white py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">About Us</h1>
                <p className="max-w-xl mx-auto text-primary-100">Learn more about our journey, our team, and our mission to revolutionize inventory management.</p>
            </div>
            <AboutSection />
        </div>
    );
}
