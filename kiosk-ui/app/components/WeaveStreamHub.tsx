/* eslint-disable react/no-unescaped-entities */
// src/app/components/WeaveStreamHub.tsx
"use client";
import React, { useState } from 'react';

interface DemoHubProps {
    onSelectDemo: (demoId: string) => void;
}

// Full list of all demos
const allDemos = [
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
        id: 'creator_studio',
        title: 'Creator Studio',
        description: 'Upload and customize video content.'
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
        id: 'keetra_beauty',
        title: 'Keetra Beauty Store',
        description: 'Full beauty retail experience with search, quiz, and product details.'
    },
];

export default function WeaveStreamHub({ onSelectDemo }: DemoHubProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter demos based on the search term (checks title and description)
    const filteredDemos = allDemos.filter(demo =>
        demo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demo.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            {/* 1. New Title */}
            <h1 className="text-6xl font-bold text-center text-white mb-4">
                WeaveStream
            </h1>
            <p className="text-xl text-center text-gray-400 mb-10">
                The Interactive Experience Platform. Find a demo or explore by category.
            </p>

            {/* 2. New Search Bar */}
            <div className="max-w-3xl mx-auto mb-12">
                <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search all demos (e.g., 'quiz', 'creator', 'video')..."
                    className="w-full p-5 bg-gray-800 border-2 border-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
                />
            </div>

            {/* 3. Dynamic Card Grid */}
            {filteredDemos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {filteredDemos.map((cat) => (
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
            ) : (
                // 4. Message for no search results
                <div className="text-center text-gray-500 text-xl">
                    <p>No demos found for "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
};