UI Contract Document — Kiosk Frontend ↔ Backend
1. Overview
This document defines the data contracts between the Kiosk UI and the Backend API for interactive retail automation. It covers click events, acknowledgements, and telemetry logs, ensuring consistent communication and integration across components.

2. Click Event (UI → Backend)
Endpoint:
 POST /events/click
Headers:
Authorization: Basic <token>


Content-Type: application/json


Request Payload:
{
  "correlation_id": "uuid-1234-5678",
  "sku_id": "sku-98765",
  "track_id": "track-42",
  "device_id": "kiosk-01",
  "ts": "2025-09-28T14:32:05.123Z"
}

Field Descriptions:
correlation_id: Unique ID for deduplication and tracing.


sku_id: Product identifier (from overlay click).


track_id: Object/person ID from CV tracker (fake in W1, live in W2).


device_id: Source kiosk or camera ID.


ts: ISO 8601 timestamp when the click occurred.


Expected Response (Success):
{
  "status": "accepted",
  "correlation_id": "uuid-1234-5678"
}

Expected Response (Failure):
{
  "status": "error",
  "error_code": "INVALID_SKU",
  "message": "The SKU provided does not exist."
}

UI Behavior:
On 200 OK → Show ✅ success toast.


On 4xx/5xx → Show ❌ error toast with retry option.



3. Action Acknowledgement (Backend → UI via MQTT WS)
Topic:
 retail/actions
Message Payload:
{
  "correlation_id": "uuid-1234-5678",
  "ack": true,
  "latency_ms": 542
}

UI Behavior:
Optimistic update when click is sent.


Replace with confirmed ack once message arrives.


Show latency in logs (optional debug).



4. Telemetry Logs (UI → Backend)
Endpoint:
 POST /telemetry
Request Payload (example):
{
  "event": "click",
  "correlation_id": "uuid-1234-5678",
  "status": "success",
  "latency_ms": 542,
  "ts": "2025-09-28T14:32:05.987Z"
}

Purpose:
Track operational health and user interactions.


Aid debugging and replay (pairs with QA harness).



5. Error & Recovery UX
Network Down → Show “Offline” banner, queue retry.


Broker Unavailable → Retry every X seconds, show warning toast.


Invalid Auth → Redirect to error screen with support code.


Rate Limit (429) → Disable clicks for N seconds, show cooldown timer.



6. Accessibility Notes
All clickable overlay boxes must be ≥44px in size.


Provide keyboard focus states for overlays.


Ensure color contrast ratio ≥4.5:1 for text/buttons.



