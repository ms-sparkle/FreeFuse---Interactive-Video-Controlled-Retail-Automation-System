// src/app/components/CameraView.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Product, Detection, ClickPayload, ToastType } from '../types';

// Mock data specific to this component
const fakeDetections: Detection[] = [
    { id: 'detect_A', box: { top: '15%', left: '20%', width: '25%', height: '30%' } },
    { id: 'detect_B', box: { top: '50%', left: '55%', width: '30%', height: '40%' } },
    { id: 'detect_C', box: { top: '60%', left: '10%', width: '20%', height: '25%' } },
];

// Mock API calls can be moved to a separate api.ts file for even cleaner code
async function postEvent(payload: ClickPayload) { /* ... same as before ... */ return { ok: true }; }
async function logTelemetry(payload: any) { /* ... same as before ... */ }
async function getTryCount(productId: string) { return { ok: true, count: Math.floor(Math.random() * 50) + 5 }; }


interface CameraViewProps {
    product: Product;
    onClose: () => void;
    showToast: (message: string, type: ToastType) => void;
}

export default function CameraView({ product, onClose, showToast }: CameraViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [activeDetection, setActiveDetection] = useState<string | null>(null);
    const [tryCount, setTryCount] = useState<number | null>(null);

    const fetchTryCount = async () => {
        const response = await getTryCount(product.id);
        if (response.ok) setTryCount(response.count);
    };

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(err => {
                console.error("Error accessing camera", err);
                if (videoRef.current) {
                    videoRef.current.src = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
                    videoRef.current.loop = true;
                }
            });
        fetchTryCount();
        return () => { /* ... cleanup logic ... */ };
    }, [product.id]);

    const handleDetectionClick = async (detection: Detection) => {
        setActiveDetection(detection.id);
        const payload: ClickPayload = { /* ... payload data ... */ timestamp: '', productId: '', detectionId: '', boxCoordinates: detection.box, cameraView: { width: 0, height: 0 } };
        logTelemetry({ event: 'detection_click_initiated', payload });
        const response = await postEvent(payload);
        if (response.ok) {
            showToast('Action successful!', 'success');
            fetchTryCount();
        } else {
            showToast('Action failed.', 'failure');
        }
        setTimeout(() => setActiveDetection(null), 300);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="relative w-full max-w-4xl aspect-video bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                <div className="absolute inset-0">
                    {fakeDetections.map(detection => (
                        <div key={detection.id} onClick={() => handleDetectionClick(detection)} className="absolute border-4 border-yellow-400 rounded-md cursor-pointer group bg-yellow-400 bg-opacity-20 hover:bg-opacity-40" style={{ ...detection.box, transform: activeDetection === detection.id ? 'scale(1.05)' : 'scale(1)', borderColor: activeDetection === detection.id ? '#34D399' : '#FBBF24' }}>
                            {/* ... detection box content ... */}
                        </div>
                    ))}
                </div>
                {/* ... UI Elements like close button, product name, and try count ... */}
                <button onClick={onClose} className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold w-12 h-12 rounded-full text-2xl flex items-center justify-center">&times;</button>
                {tryCount !== null && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white py-2 px-4 rounded-lg"><p className="font-bold text-lg"><span className="text-yellow-400">{tryCount}</span> people have tried this today!</p></div>}
            </div>
        </div>
    );
};