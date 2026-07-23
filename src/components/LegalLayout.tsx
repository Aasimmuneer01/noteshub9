import React from 'react';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function LegalLayout({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <h1 className="text-4xl font-bold mb-8 text-white">{title}</h1>
        <div className="prose max-w-none text-white">
            {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
