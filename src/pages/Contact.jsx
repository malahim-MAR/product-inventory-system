import React from 'react';
import ContactSection from '../components/sections/ContactSection';

export default function Contact() {
    return (
        <div className="pt-16">
            <div className="bg-primary-600 text-white py-20 text-center">
                <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
                <p className="max-w-xl mx-auto text-primary-100">We are here to assist you. Reach out to us via phone, email, or visit our office.</p>
            </div>
            <ContactSection />
        </div>
    );
}
