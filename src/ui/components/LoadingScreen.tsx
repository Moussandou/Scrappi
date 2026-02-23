"use client";

import React from "react";

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-paper">
            <div className="paper-grain opacity-60"></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Artistic Loader */}
                <div className="w-20 h-20 relative mb-8">
                    <div className="absolute inset-0 border-4 border-paper-dark/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-4 bg-paper rounded-full flex items-center justify-center shadow-inner">
                        <span className="text-2xl">✒️</span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-xl font-display text-paper-dark font-medium tracking-tight animate-pulse">
                        Scrappi
                    </h2>
                    <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"></div>
                    </div>
                </div>
            </div>

            {/* Subtle background texture or elements */}
            <div className="absolute bottom-10 left-10 opacity-10 rotate-12 select-none pointer-events-none">
                <span className="text-8xl font-hand">Scrapbook</span>
            </div>
            <div className="absolute top-20 right-20 opacity-10 -rotate-6 select-none pointer-events-none">
                <span className="text-6xl font-dancing">Creative</span>
            </div>
        </div>
    );
};
