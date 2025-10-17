// src/app/components/Toast.tsx
import React, { useEffect } from 'react';
import { ToastType } from '../types';

interface ToastProps {
    message: string;
    type: ToastType;
    onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 3000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const typeClasses = {
        success: 'bg-green-500',
        failure: 'bg-red-500',
    };

    return (
        <div className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-xl text-white font-semibold transition-transform transform translate-y-0 ${typeClasses[type]}`}>
            {message}
        </div>
    );
};