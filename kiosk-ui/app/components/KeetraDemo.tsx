"use client";
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./keetra/components/ui/tooltip"; // Ensure you have this or point to Keetra's version
import { Toaster } from "./keetra/components/ui/toaster"; // Ensure you have this or point to Keetra's version
import { AppProvider } from "./keetra/lib/app-context"; // Point to where you pasted the file

// Import the Keetra Pages
import Start from "./keetra/pages/Start";
import Quiz from "./keetra/pages/Quiz";
import Search from "./keetra/pages/Search";
import SearchResults from "./keetra/pages/SearchResults";
import ProductDetail from "./keetra/pages/ProductDetail";
import Customize from "./keetra/pages/Customize";

const queryClient = new QueryClient();

export default function KeetraDemo({ onExit }: { onExit: () => void }) {
    return (
        <div className="keetra-wrapper h-screen w-full bg-white overflow-hidden relative">
            {/* Exit Button to return to WeaveStream Hub */}
            <button
                onClick={onExit}
                className="absolute top-4 left-4 z-50 bg-black/50 hover:bg-black/70 text-white px-4 py-2 rounded-full font-bold"
            >
                &larr; Exit Demo
            </button>

            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <AppProvider>
                        <Toaster />
                        {/* MemoryRouter keeps the demo navigation internal */}
                        <MemoryRouter>
                            <Routes>
                                <Route path="/" element={<Start />} />
                                <Route path="/quiz" element={<Quiz />} />
                                <Route path="/search" element={<Search />} />
                                <Route path="/search-results" element={<SearchResults />} />
                                <Route path="/product/:id" element={<ProductDetail />} />
                                <Route path="/customize" element={<Customize />} />
                            </Routes>
                        </MemoryRouter>
                    </AppProvider>
                </TooltipProvider>
            </QueryClientProvider>
        </div>
    );
}