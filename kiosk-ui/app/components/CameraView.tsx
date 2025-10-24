// src/app/components/CameraView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Product, Detection, ClickPayload, ToastType, TelemetryPayload } from '../types';

// --- TYPE DEFINITIONS FOR API RESPONSES ---
// Define what success and failure look like
type PostEventSuccess = { ok: true };
type PostEventFailure = { ok: false; message: string };
type PostEventResponse = Promise<PostEventSuccess | PostEventFailure>;

// Mock data specific to this component
const fakeDetections: Detection[] = [
    { id: 'detect_A', box: { top: '15%', left: '20%', width: '25%', height: '30%' } },
    { id: 'detect_B', box: { top: '50%', left: '55%', width: '30%', height: '40%' } },
    { id: 'detect_C', box: { top: '60%', left: '10%', width: '20%', height: '25%' } },
];

// --- MOCK API CALLS (CORRECTED) ---

// --- CHANGE #1: Added the explicit 'PostEventResponse' return type ---
async function postEvent(payload: ClickPayload): PostEventResponse {
    console.log('POST to /events/click:', payload);

    // --- CHANGE #2: Re-added the failure case to the mock ---
    if (Math.random() > 0.1) { // 90% success
        return { ok: true };
    } else { // 10% failure
        return { ok: false, message: 'Failed to record event.' };
    }
}

async function logTelemetry(payload: TelemetryPayload) {
    console.log('POST to /telemetry:', payload);
    return { ok: true };
}

async function getTryCount(productId: string) {
    console.log(`GET /products/${productId}/try-count`);
    return { ok: true, count: Math.floor(Math.random() * 50) + 5 };
}


interface CameraViewProps {
    product: Product;
    onClose: () => void;
    showToast: (message: string, type: ToastType) => void;
}

export default function CameraView({ product, onClose, showToast }: CameraViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [activeDetection, setActiveDetection] = useState<string | null>(null);
    const [tryCount, setTryCount] = useState<number | null>(null);

    const fetchTryCount = async () => {
        const response = await getTryCount(product.id);
        if (response.ok) setTryCount(response.count);
    };

    // EFFECT #1: Handles Camera Setup & Teardown (Runs ONCE)
    useEffect(() => {
        const getCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera, falling back to local video.", err);
                if (videoRef.current) {
                    videoRef.current.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                    videoRef.current.loop = true;
                }
            }
        };

        getCamera();

        return () => {
            if (streamRef.current) {
                const tracks = streamRef.current.getTracks();
                tracks.forEach(track => track.stop());
                console.log("Camera stream stopped successfully.");
            }
        };
    }, []); // <-- Empty array means this effect runs only ONCE on mount/unmount

    // EFFECT #2: Handles Data Fetching (Runs when product changes)
    useEffect(() => {
        fetchTryCount();
    }, [product.id]);


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

        logTelemetry({ event: 'detection_click_initiated', payload });

        const response = await postEvent(payload);

        if (response.ok) {
            // Success: response type is { ok: true }
            showToast('Action successful!', 'success');
            fetchTryCount();
        } else {
            // --- CHANGE #3: Removed '(as any)' ---
            // Failure: TypeScript now knows response type is { ok: false, message: string }
            showToast(response.message || 'Action failed.', 'failure');
        }
        setTimeout(() => setActiveDetection(null), 300);
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

                {/* Social Proof */}
                {tryCount !== null && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white py-2 px-4 rounded-lg">
                        <p className="font-bold text-lg"><span className="text-yellow-400">{tryCount}</span> people have tried this today!</p>
                    </div>
                )}
            </div>
        </div>
    );
};