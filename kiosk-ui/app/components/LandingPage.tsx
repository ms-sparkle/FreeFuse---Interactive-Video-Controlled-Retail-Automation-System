import React from 'react';

// The props interface for this component
interface LandingPageProps {
    onEnter: () => void;
}

// Use "export default" to make it available to other files
export default function LandingPage({ onEnter }: LandingPageProps) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 ...">
            <h1 className="text-5xl font-bold mb-4">Interactive Kiosk</h1>
            <p className="text-xl ...">Select a product to begin the experience.</p>
            <button onClick={onEnter} className="bg-indigo-600 ...">
                Start
            </button>
        </div>
    );
};