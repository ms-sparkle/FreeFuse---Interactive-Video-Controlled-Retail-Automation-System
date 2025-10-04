'use client';

import { useState } from 'react';

export default function HomePage() {
    // 'useState' is a React Hook that lets you add a state variable to your component.
    // Here, 'count' is our state variable, and 'setCount' is the function to update it.
    const [count, setCount] = useState(0);

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl">
                <h1 className="text-5xl font-bold mb-4">
                    Testing from page.tsx! ✨
                </h1>
                <p className="text-lg text-gray-300 mb-6">
                    Click the button! It will do something cool.
                </p>

                {/* This div displays the current count */}
                <div className="my-4">
                    <p className="text-xl">Current Count:</p>
                    <p className="text-6xl font-mono font-bold text-cyan-400">{count}</p>
                </div>

                {/* This button increments the count when clicked */}
                <button
                    onClick={() => setCount(count + 1)}
                    className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-lg transition-colors duration-300"
                >
                    Click Me
                </button>
            </div>
        </main>
    );
}