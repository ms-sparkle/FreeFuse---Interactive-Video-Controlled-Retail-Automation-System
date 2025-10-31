// src/app/components/SkincareQuiz.tsx
"use client";
import React, { useState } from 'react';

// --- Type Definitions for the Quiz ---
interface QuizQuestion {
    id: string;
    text: string;
    options: string[];
}

interface UserAnswers {
    [key: string]: string;
}

interface ProductRecommendation {
    id: string;
    name: string;
    matchScore: number;
    features: string[];
    price: string;
    rating: string;
}

// --- Mock Data ---
const quizQuestions: QuizQuestion[] = [
    {
        id: 'q1',
        text: 'What brings you here today?',
        options: ['🌞 Dry Skin', '💧 Oily Skin', '⏰ Anti-Aging', '☀️ Sun Protection'],
    },
    {
        id: 'q2',
        text: 'Any sensitivities we should know about?',
        options: ['🌿 Fragrance-Free', '🚫 No Parabens', '🌱 Vegan', '✅ No Restrictions'],
    },
    {
        id: 'q3',
        text: "What's your budget today?",
        options: ['$15 - $25', '$25 - $40', '$40+', 'Just browsing'],
    },
    {
        id: 'q4',
        text: 'Looking for day or night use?',
        options: ['Day', 'Night', 'Both'],
    },
];

const mockRecommendations: ProductRecommendation[] = [
    { 
        id: 'sku_cerave_001', 
        name: 'CeraVe Moisturizing Cream', 
        matchScore: 92, 
        features: ['Ceramides + Hyaluronic', 'Fragrance-free'], 
        price: '$15.99',
        rating: '4.7★ (2.3K)'
    },
    { 
        id: 'sku_laroche_002', 
        name: 'La Roche-Posay Toleriane', 
        matchScore: 89, 
        features: [], 
        price: '$20.99',
        rating: '4.6★ (1.8K)'
    },
    { 
        id: 'sku_neutro_003', 
        name: 'Neutrogena Hydro Boost', 
        matchScore: 87, 
        features: [], 
        price: '$18.49',
        rating: '4.5★ (3.1K)'
    },
];

// --- Main Quiz Component ---
export default function SkincareQuiz() {
    const [step, setStep] = useState(0); // 0 = Attraction, 1-4 = Questions, 5 = Results, 6 = Deep Dive
    const [answers, setAnswers] = useState<UserAnswers>({});
    const [selectedProduct, setSelectedProduct] = useState<ProductRecommendation | null>(null);

    const handleStart = () => {
        // Here you would POST /sessions/start
        console.log("Starting new session...");
        setStep(1);
    };

    const handleAnswer = (questionId: string, answer: string) => {
        // Here you would POST /sessions/{id}/answer
        console.log(`Answered ${questionId}: ${answer}`);
        const newAnswers = { ...answers, [questionId]: answer };
        setAnswers(newAnswers);

        if (step < quizQuestions.length) {
            setStep(step + 1);
        } else {
            // Last question answered, move to results
            console.log("Fetching recommendations...", newAnswers);
            setStep(quizQuestions.length + 1); // Move to Results step
        }
    };

    const currentQuestion = quizQuestions[step - 1];
    const totalQuestions = quizQuestions.length;

    // Step 0: Attraction Screen
    if (step === 0) {
        return (
            <div 
                className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-8 cursor-pointer"
                onClick={handleStart}
            >
                <h1 className="text-6xl font-bold mb-6">✨ FIND YOUR PERFECT MATCH ✨</h1>
                <div className="text-3xl font-semibold bg-white text-gray-900 py-3 px-8 rounded-lg mb-8">
                    [Tap Anywhere to Start]
                </div>
                <p className="text-2xl text-gray-400">Personalized recommendations in under 60 seconds</p>
            </div>
        );
    }

    // Steps 1-4: Question Screens
    if (step > 0 && step <= totalQuestions) {
        return (
            <div className="flex flex-col h-screen bg-gray-800 text-white p-8">
                {/* Mock Video Host Area */}
                <div className="w-full h-1/3 bg-black rounded-lg flex items-center justify-center text-gray-500 mb-6">
                    [Video: Maya, smiling host]
                </div>
                
                <h2 className="text-4xl font-bold mb-8 text-center">{currentQuestion.text}</h2>
                
                <div className="flex flex-col space-y-4">
                    {currentQuestion.options.map((option) => (
                        <button
                            key={option}
                            onClick={() => handleAnswer(currentQuestion.id, option)}
                            className="bg-gray-700 hover:bg-indigo-600 text-white text-2xl font-semibold p-6 rounded-lg text-left transition-colors"
                        >
                            {option}
                        </button>
                    ))}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-auto text-center">
                    <p className="text-lg text-gray-400">Progress: {step}/{totalQuestions}</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                        <div 
                            className="bg-indigo-600 h-2.5 rounded-full" 
                            style={{ width: `${(step / totalQuestions) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }

    // Step 5: Recommendations Screen
    if (step === totalQuestions + 1 && !selectedProduct) {
        return (
            <div className="flex flex-col h-screen bg-gray-800 text-white p-8">
                <div className="w-full h-1/4 bg-black rounded-lg flex items-center justify-center text-gray-500 mb-6">
                    [Video: Maya gestures to products]
                </div>
                <h2 className="text-4xl font-bold mb-6">Your Top Matches:</h2>
                
                <div className="flex flex-col space-y-4 overflow-y-auto">
                    {mockRecommendations.map((prod, index) => (
                        <div
                            key={prod.id}
                            onClick={() => setSelectedProduct(prod)}
                            className="bg-gray-700 p-6 rounded-lg cursor-pointer hover:bg-gray-600"
                        >
                            <h3 className="text-2xl font-bold text-yellow-400 mb-2">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} #{index + 1}: {prod.name} ({prod.matchScore}% match)
                            </h3>
                            {index === 0 && prod.features.map(f => <p key={f} className="text-lg ml-8">• {f}</p>)}
                            <p className="text-lg font-semibold mt-2">{prod.price} • {prod.rating}</p>
                            {index === 0 ? (
                                <div className="flex space-x-4 mt-4">
                                    <button className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded">Try Sample</button>
                                    <button className="bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded">Buy Now</button>
                                </div>
                            ) : (
                                <button className="text-indigo-400 mt-2">View Details</button>
                            )}
                        </div>
                    ))}
                </div>
                <button 
                    onClick={() => { setStep(1); setAnswers({}); }}
                    className="bg-gray-700 hover:bg-gray-600 py-3 px-6 rounded-lg mt-6"
                >
                    Start Over
                </button>
            </div>
        );
    }
    
    // Step 6: Product Deep Dive
    if (selectedProduct) {
         return (
            <div className="flex flex-col h-screen bg-gray-800 text-white p-8">
                <div className="w-full h-1/4 bg-black rounded-lg flex items-center justify-center text-gray-500 mb-6">
                    [Video: Product demonstration]
                </div>
                <h2 className="text-4xl font-bold mb-2">{selectedProduct.name}</h2>
                <p className="text-xl font-semibold mb-4">{selectedProduct.price} • {selectedProduct.rating}</p>
                
                <div className="text-lg space-y-2 mb-6">
                    <p>✓ Dermatologist-developed</p>
                    <p>✓ 24-hour hydration</p>
                    <p>✓ Non-comedogenic</p>
                </div>
                
                <h3 className="text-2xl font-bold mb-2">Key Ingredients:</h3>
                <ul className="list-disc list-inside text-lg mb-6">
                    <li>Ceramides 1, 3, 6-II</li>
                    <li>Hyaluronic Acid</li>
                    <li>MVE Technology</li>
                </ul>
                
                <div className="grid grid-cols-2 gap-4 mt-auto">
                     <button className="bg-green-600 hover:bg-green-700 p-4 rounded text-xl font-bold">Try Sample<br/><span className="font-normal">FREE</span></button>
                     <button className="bg-indigo-600 hover:bg-indigo-700 p-4 rounded text-xl font-bold">Buy Now<br/><span className="font-normal">{selectedProduct.price}</span></button>
                </div>
                
                 <button 
                    onClick={() => setSelectedProduct(null)}
                    className="bg-gray-700 hover:bg-gray-600 py-3 px-6 rounded-lg mt-4"
                >
                    &larr; Back to Results
                </button>
            </div>
         );
    }

    return null; // Fallback
}