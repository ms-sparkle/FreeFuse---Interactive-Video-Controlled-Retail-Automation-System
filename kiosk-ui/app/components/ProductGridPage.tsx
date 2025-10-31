// src/app/components/ProductGridPage.tsx
import React from 'react';
import { Product } from '../types';

// Mock data can live here or be imported from a separate data file
const products: Product[] = [
    { id: 'prod_001', name: 'Smart Glasses', imageUrl: 'https://placehold.co/400x400/3B82F6/FFFFFF?text=Glasses' },
    { id: 'prod_002', name: 'AI Camera', imageUrl: 'https://placehold.co/400x400/10B981/FFFFFF?text=Camera' },
    { id: 'prod_003', name: 'VR Headset', imageUrl: 'https://placehold.co/400x400/8B5CF6/FFFFFF?text=Headset' },
    { id: 'prod_004', name: 'Drone', imageUrl: 'https://placehold.co/400x400/F59E0B/FFFFFF?text=Drone' },
];

interface ProductGridPageProps {
    onProductSelect: (product: Product) => void;
}

export default function ProductGridPage({ onProductSelect }: ProductGridPageProps) {
    return (
        <div className="min-h-screen bg-gray-800 p-8">
            <h1 className="text-4xl font-bold text-center text-white mb-10">Choose a Product</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {products.map((product) => (
                    <div key={product.id} onClick={() => onProductSelect(product)} className="bg-gray-700 rounded-lg shadow-lg overflow-hidden cursor-pointer group transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover" />
                        <div className="p-5">
                            <h2 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">{product.name}</h2>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};