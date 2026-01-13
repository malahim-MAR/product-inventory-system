import React from 'react';
import Hero from '../components/sections/Hero';
import AboutSection from '../components/sections/AboutSection';
import ServicesSection from '../components/sections/ServicesSection';
import PricingSection from '../components/sections/PricingSection';
import ContactSection from '../components/sections/ContactSection';

export default function Home() {
    return (
        <main>
            <Hero />
            <AboutSection />
            <ServicesSection />
            <PricingSection />
            <ContactSection />
        </main>
    );
}
