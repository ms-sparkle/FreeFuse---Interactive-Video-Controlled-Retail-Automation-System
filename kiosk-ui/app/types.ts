// src/app/types.ts

export interface Product {
    id: string;
    name: string;
    imageUrl: string;
}

export interface Detection {
    id: string;
    box: {
        top: string;
        left: string;
        width: string;
        height: string;
    };
}

export type ToastType = 'success' | 'failure';

export interface ToastInfo {
    show: boolean;
    message: string;
    type: ToastType;
}

export interface ClickPayload {
    timestamp: string;
    productId: string;
    detectionId: string;
    boxCoordinates: Detection['box'];
    cameraView: {
        width: number;
        height: number;
    };
}

export interface TelemetryPayload {
    event: string;
    payload: ClickPayload;
}