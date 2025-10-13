Kiosk UI Skeleton
This project provides the initial frontend skeleton for the Kiosk interface, built with Next.js.
 It includes a simple navigation flow, fake detection overlays, and telemetry logging for testing purposes.

🚀 Running the App Locally
1. Prerequisites
Node.js (v18+ recommended)


npm or yarn


2. Install dependencies
npm install
# or
yarn install

3. Start the dev server
npm run dev
# or
yarn dev

The app will be available at http://localhost:3000.
4. Environment variables
Create a .env.local file with the following values (sample defaults shown):
NEXT_PUBLIC_API_BASE=http://localhost:4000
NEXT_PUBLIC_VIDEO_URL=/sample.mp4

NEXT_PUBLIC_API_BASE: where clicks/telemetry POST


NEXT_PUBLIC_VIDEO_URL: MP4 fallback stream path



📂 Routes & Pages
The skeleton includes the following navigation flow:
Landing Page (/)


Entry point to the kiosk.


Simple CTA to enter product grid.


Product Grid (/grid)


Displays a mock set of products.


Each box is clickable → triggers fake detection POST.


Camera View (/camera)


Shows a WebRTC stream if available.


Falls back to an MP4 video when WebRTC fails.


Overlays static/fake detection boxes.


Toasts


Triggered on click or server response.


Provide user feedback for actions.



🎥 WebRTC & MP4 Fallback
The Camera View supports two video preview modes:
WebRTC:


Connects to a configured signaling server.


Shows live preview when available.


Fallback (MP4 video):


Uses a static MP4 source (NEXT_PUBLIC_VIDEO_URL).


Ensures UI is testable without backend setup.



🛠 Development Notes
Fake detection overlays are generated statically (no real backend yet).


Clicks POST to NEXT_PUBLIC_API_BASE with test payloads.


Telemetry logs can be viewed in browser console.

