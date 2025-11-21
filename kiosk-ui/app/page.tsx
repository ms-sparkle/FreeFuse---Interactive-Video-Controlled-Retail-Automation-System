// src/app/page.tsx
"use client";
import React, { useState } from 'react';

// Import shared types and components
import { Product, ToastInfo, ToastType } from './types';
import LandingPage from './components/LandingPage';
//import DemoHub from './components/DemoHub';
import WeaveStreamHub from './components/WeaveStreamHub';
import ProductGridPage from './components/ProductGridPage';
import CameraView from './components/CameraView';
import Toast from './components/Toast';
import SkincareQuiz from './components/SkinCareQuiz';
import CreatorStudio from './components/CreatorStudio'; // <-- 1. NEW IMPORT
import KeetraDemo from './components/KeetraDemo';

// --- MAIN APP ---
export default function Home() {
    // ... (all state variables remain the same)
    const [view, setView] = useState<'landing' | 'hub'>('landing');
    const [activeDemo, setActiveDemo] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [toastInfo, setToastInfo] = useState<ToastInfo>({ show: false, message: '', type: 'success' });

    const showToast = (message: string, type: ToastType) => {
        setToastInfo({ show: true, message, type });
    };

    const returnToHub = () => {
        setSelectedProduct(null);
        setActiveDemo(null);
    };

    const renderActiveDemo = () => {
        const backButton = (
            <button
                onClick={returnToHub}
                className="fixed bottom-5 left-5 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg z-[60]">
                &larr; Back to Hub
            </button>
        );

        switch (activeDemo) {
            case 'skincare_quiz':
                return (
                    <>
                        {backButton}
                        <SkincareQuiz />
                    </>
                );

            case 'pick_to_promo':
                return (
                    <>
                        {backButton}
                        <ProductGridPage onProductSelect={setSelectedProduct} />
                        {selectedProduct && (
                            <CameraView
                                product={selectedProduct}
                                onClose={() => setSelectedProduct(null)}
                                showToast={showToast}
                            />
                        )}
                    </>
                );

            // ---NEW CASES ADD HERE ---
            case 'creator_studio':
                return (
                    <>
                        {backButton}
                        <CreatorStudio />
                    </>
                );

            case 'education_training':
                return (
                    // ... (this case remains the same)
                    <>
                        {backButton}
                        <div className="flex items-center justify-center h-screen bg-gray-800 text-white text-3xl">Education Demo Placeholder</div>
                    </>
                );

            case 'keetra_beauty':
                return <KeetraDemo onExit={returnToHub} />;

            default:
                return <WeaveStreamHub onSelectDemo={setActiveDemo} />;
        }
    };

    return (
        <>
            {view === 'landing' ? (
                <LandingPage onEnter={() => setView('hub')} />
            ) : (
                renderActiveDemo()
            )}
            {toastInfo.show && (
                <Toast
                    message={toastInfo.message}
                    type={toastInfo.type}
                    onDismiss={() => setToastInfo({ ...toastInfo, show: false })}
                />
            )}
        </>
    );
}