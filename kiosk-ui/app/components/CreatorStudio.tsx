// src/app/components/CreatorStudio.tsx
"use client";
import React, { useState } from 'react';

export default function CreatorStudio() {
    // State to hold the "customization" data
    const [videoTitle, setVideoTitle] = useState('Maya\'s Welcome Video');
    const [fileName, setFileName] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // This just grabs the file name to display it
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFileName(event.target.files[0].name);
            setIsSubmitted(false); // Reset submit state if new file is chosen
        }
    };

    // This simulates the "submit" and shows the mock video
    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault(); // Prevent form from reloading page
        if (fileName) {
            console.log('Simulating upload for:', fileName, 'with title:', videoTitle);
            // In a real app, this would upload the file and save the title
            setIsSubmitted(true); // Show the mock video preview
        } else {
            alert('Please select a video file to "upload" first.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-800 text-white p-8">
            <h1 className="text-4xl font-bold mb-8 text-center">Creator Studio</h1>

            <form
                onSubmit={handleSubmit}
                className="max-w-3xl mx-auto bg-gray-700 p-8 rounded-lg shadow-lg"
            >
                <h2 className="text-2xl font-bold mb-6">Upload & Customize Your Video</h2>

                {/* 1. File Upload Button */}
                <div className="mb-6">
                    <label className="block text-lg font-medium text-gray-300 mb-2">
                        1. Upload Video File
                    </label>
                    <label className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-lg cursor-pointer inline-flex items-center transition-colors">
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                        <span>{fileName ? `Selected: ${fileName}` : 'Choose a video file...'}</span>
                        <input
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={handleFileChange}
                        />
                    </label>
                </div>

                {/* 2. Customization Field */}
                <div className="mb-8">
                    <label htmlFor="videoTitle" className="block text-lg font-medium text-gray-300 mb-2">
                        2. Customize Title
                    </label>
                    <input
                        type="text"
                        id="videoTitle"
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Welcome Video, Product Demo, etc."
                    />
                </div>

                {/* 3. Submit Button */}
                <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition-colors"
                >
                    Submit & Preview
                </button>

                {/* 4. Video Preview Area */}
                {isSubmitted && (
                    <div className="mt-10">
                        <h3 className="text-xl font-bold mb-4">Mock Preview:</h3>
                        <p className="text-gray-400 mb-2">Showing mock video for your upload: {videoTitle}</p>
                        <div className="w-full bg-black rounded-lg overflow-hidden aspect-video">
                            <video
                                // Here we show the mock video as requested
                                src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                controls
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}