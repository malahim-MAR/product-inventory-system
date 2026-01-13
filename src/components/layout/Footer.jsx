import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl">
                                M
                            </div>
                            <span className="text-xl font-bold text-white">
                                Malahim Inv
                            </span>
                        </div>
                        <p className="text-sm text-gray-400">
                            Transforming your inventory management experience with cutting-edge technology and premium design.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-primary-400 transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="hover:text-primary-400 transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="hover:text-primary-400 transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="hover:text-primary-400 transition-colors"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li><Link to="/" className="hover:text-primary-400 transition-colors">Home</Link></li>
                            <li><Link to="/about" className="hover:text-primary-400 transition-colors">About Us</Link></li>
                            <li><Link to="/services" className="hover:text-primary-400 transition-colors">Services</Link></li>
                            <li><Link to="/pricing" className="hover:text-primary-400 transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Contact Info</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary-500 shrink-0" />
                                <span>123 Business Avenue, Tech Hub District, NY 10001</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary-500 shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary-500 shrink-0" />
                                <span>contact@malahim.com</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">Newsletter</h3>
                        <p className="text-sm text-gray-400 mb-4">Subscribe to our newsletter for updates.</p>
                        <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-gray-800 border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-500 transition-colors font-medium">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} Malahim Inventory. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
