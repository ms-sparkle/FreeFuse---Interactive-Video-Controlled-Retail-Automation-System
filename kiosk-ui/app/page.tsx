"use client";
import React, { useState, useEffect, useRef } from 'react';

// --- TYPE DEFINITIONS ---
interface Product {
    id: string;
    name: string;
    imageUrl: string;
}

interface Detection {
    id: string;
    box: {
        top: string;
        left: string;
        width: string;
        height: string;
    };
}

type ToastType = 'success' | 'failure';

interface ToastInfo {
    show: boolean;
    message: string;
    type: ToastType;
}

interface ClickPayload {
    timestamp: string;
    productId: string;
    detectionId: string;
    boxCoordinates: Detection['box'];
    cameraView: {
        width: number;
        height: number;
    };
}

interface TelemetryPayload {
    event: string;
    payload: ClickPayload;
}

// --- MOCK DATA ---
const products: Product[] = [
    { id: 'prod_001', name: 'Smart Glasses', imageUrl: 'https://placehold.co/400x400/3B82F6/FFFFFF?text=Glasses' },
    { id: 'prod_002', name: 'AI Camera', imageUrl: 'https://placehold.co/400x400/10B981/FFFFFF?text=Camera' },
    { id: 'prod_003', name: 'VR Headset', imageUrl: 'https://placehold.co/400x400/8B5CF6/FFFFFF?text=Headset' },
    { id: 'prod_004', name: 'Drone', imageUrl: 'https://placehold.co/400x400/F59E0B/FFFFFF?text=Drone' },
];

const fakeDetections: Detection[] = [
    { id: 'detect_A', box: { top: '15%', left: '20%', width: '25%', height: '30%' } },
    { id: 'detect_B', box: { top: '50%', left: '55%', width: '30%', height: '40%' } },
    { id: 'detect_C', box: { top: '60%', left: '10%', width: '20%', height: '25%' } },
];

// --- API HELPER FUNCTIONS ---
// These simulate network requests.
async function postEvent(payload: ClickPayload) {
    console.log('POST to /events/click:', payload);
    // Simulate a network request that might fail
    if (Math.random() > 0.1) { // 90% success rate
        return { ok: true, status: 200, message: `Event for ${payload.detectionId} recorded.` };
    } else {
        return { ok: false, status: 500, message: 'Failed to record event. Server error.' };
    }
}

async function logTelemetry(payload: TelemetryPayload) {
    console.log('POST to /telemetry:', payload);
    // This is a "fire and forget" call, so we don't need to handle response.
    return { ok: true };
}


// --- UI COMPONENTS ---
interface ToastProps {
    message: string;
    type: ToastType;
    onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white font-semibold transition-transform transform translate-y-20';
    const typeClasses: { [key in ToastType]: string } = {
        success: 'bg-green-500',
        failure: 'bg-red-500',
    };
    const visibleClasses = 'translate-y-0';

    return (
        <div className={`${baseClasses} ${typeClasses[type]} ${visibleClasses}`}>
            {message}
        </div>
    );
};

interface LandingPageProps {
    onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white text-center p-4">
        <h1 className="text-5xl font-bold mb-4">Interactive Kiosk</h1>
        <p className="text-xl text-gray-400 mb-8">Select a product to begin the experience.</p>
        <button
            onClick={onEnter}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
        >
            Start
        </button>
    </div>
);

interface ProductGridPageProps {
    onProductSelect: (product: Product) => void;
}

const ProductGridPage: React.FC<ProductGridPageProps> = ({ onProductSelect }) => (
    <div className="min-h-screen bg-gray-800 p-8">
        <h1 className="text-4xl font-bold text-center text-white mb-10">Choose a Product</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {products.map((product) => (
                <div
                    key={product.id}
                    onClick={() => onProductSelect(product)}
                    className="bg-gray-700 rounded-lg shadow-lg overflow-hidden cursor-pointer group transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                    <img src={product.imageUrl} alt={product.name} className="w-full h-56 object-cover" />
                    <div className="p-5">
                        <h2 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors">{product.name}</h2>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

interface CameraViewProps {
    product: Product;
    onClose: () => void;
    showToast: (message: string, type: ToastType) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ product, onClose, showToast }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [activeDetection, setActiveDetection] = useState<string | null>(null);

    useEffect(() => {
        // Attempt to get user media
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.error("Error accessing camera, falling back to local video.", err);
                if (videoRef.current) {
                    // Fallback to a placeholder video if camera fails
                    videoRef.current.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                    videoRef.current.loop = true;
                }
            });

        // Cleanup function to stop video stream
        return () => {
            if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    const handleDetectionClick = async (detection: Detection) => {
        setActiveDetection(detection.id);

        const payload: ClickPayload = {
            timestamp: new Date().toISOString(),
            productId: product.id,
            detectionId: detection.id,
            boxCoordinates: detection.box,
            cameraView: {
                width: videoRef.current ? videoRef.current.videoWidth : 0,
                height: videoRef.current ? videoRef.current.videoHeight : 0,
            }
        };

        // Log telemetry first (fire and forget)
        logTelemetry({ event: 'detection_click_initiated', payload });

        // Post the main event and handle response
        const response = await postEvent(payload);

        if (response.ok) {
            showToast('Action successful!', 'success');
        } else {
            showToast(response.message, 'failure');
        }

        setTimeout(() => setActiveDetection(null), 300); // Reset visual feedback
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>

                {/* Detections Overlay */}
                <div className="absolute inset-0">
                    {fakeDetections.map(detection => (
                        <div
                            key={detection.id}
                            onClick={() => handleDetectionClick(detection)}
                            className="absolute border-4 border-yellow-400 rounded-md cursor-pointer group bg-yellow-400 bg-opacity-20 hover:bg-opacity-40 transition-all duration-200"
                            style={{
                                ...detection.box,
                                minWidth: '44px',
                                minHeight: '44px',
                                transform: activeDetection === detection.id ? 'scale(1.05)' : 'scale(1)',
                                borderColor: activeDetection === detection.id ? '#34D399' : '#FBBF24'
                            }}
                        >
                            <span className="absolute -top-7 left-0 bg-yellow-400 text-black text-sm font-bold px-2 py-0.5 rounded-sm opacity-80 group-hover:opacity-100">
                                {detection.id}
                            </span>
                        </div>
                    ))}
                </div>

                {/* UI Elements */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg">
                    <h3 className="font-bold text-lg">Product: {product.name}</h3>
                </div>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold w-12 h-12 rounded-full text-2xl flex items-center justify-center transition duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-red-500"
                    aria-label="Close camera view"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};


// --- MAIN APP ---

export default function Home() {
    const [page, setPage] = useState<'landing' | 'grid'>('landing');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [toastInfo, setToastInfo] = useState<ToastInfo>({ show: false, message: '', type: 'success' });

    const showToast = (message: string, type: ToastType) => {
        setToastInfo({ show: true, message, type });
    };

    const handleProductSelect = (product: Product) => {
        setSelectedProduct(product);
    };

    const closeCamera = () => {
        setSelectedProduct(null);
    };

    const renderContent = () => {
        switch (page) {
            case 'grid':
                return <ProductGridPage onProductSelect={handleProductSelect} />;
            case 'landing':
            default:
                return <LandingPage onEnter={() => setPage('grid')} />;
        }
    };

    return (
        <>
            {renderContent()}
            {selectedProduct && (
                <CameraView
                    product={selectedProduct}
                    onClose={closeCamera}
                    showToast={showToast}
                />
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

