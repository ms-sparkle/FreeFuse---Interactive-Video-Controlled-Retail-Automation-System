// src/app/components/DemoHub.tsx
import React from 'react';

interface DemoHubProps {
    onSelectDemo: (demoId: string) => void;
}

export default function DemoHub({ onSelectDemo }: DemoHubProps) {
    const demoCategories = [
        {
            id: 'skincare_quiz',
            title: 'Skincare Recommendation Quiz',
            description: 'A guided quiz to find the perfect product.'
        },
        {
            id: 'pick_to_promo',
            title: 'Pick-to-Promo (Tech Demo)',
            description: 'Click video detections to trigger backend events.'
        },
        {
            id: 'education_training',
            title: 'Education & Training',
            description: 'Simulations for staff and students.'
        },
        {
            id: 'enterprise_integration',
            title: 'Enterprise Integration',
            description: 'Connecting with backend business systems.'
        },
        {
            id: 'creator_content',
            title: 'Creator & Content',
            description: 'Tools for building custom campaigns.'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <h1 className="text-5xl font-bold text-center text-white mb-4">Use Case Encyclopedia</h1>
            <p className="text-xl text-center text-gray-400 mb-12">Select a category to explore its capabilities.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {demoCategories.map((cat) => (
                    <div
                        key={cat.id}
                        onClick={() => onSelectDemo(cat.id)}
                        className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer transition duration-300 hover:bg-gray-700 hover:shadow-indigo-500/20 transform hover:-translate-y-1"
                    >
                        <h2 className="text-2xl font-bold text-white mb-2">{cat.title}</h2>
                        <p className="text-gray-400">{cat.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};