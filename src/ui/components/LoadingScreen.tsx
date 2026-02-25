"use client";

import React from "react";

export const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-paper animate-in fade-in duration-700">
            <div className="paper-grain opacity-60"></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Artistic Loader - Speeded up */}
                <div className="w-16 h-16 relative mb-6 transition-all duration-300">
                    <div className="absolute inset-0 border-2 border-paper-dark/10 rounded-full"></div>
                    <div className="absolute inset-0 border-2 border-sage rounded-full border-t-transparent animate-[spin_0.6s_linear_infinite]"></div>
                    <div className="absolute inset-3 bg-paper rounded-full flex items-center justify-center shadow-inner">
                        <span className="text-xl">✒️</span>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                    <h2 className="text-lg font-display text-ink-light font-bold tracking-widest uppercase text-[10px]">
                        Scrappi
                    </h2>
                    <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-sage/40 animate-bounce [animation-duration:0.6s] [animation-delay:-0.2s]"></div>
                        <div className="w-1 h-1 rounded-full bg-sage/40 animate-bounce [animation-duration:0.6s] [animation-delay:-0.1s]"></div>
                        <div className="w-1 h-1 rounded-full bg-sage/40 animate-bounce [animation-duration:0.6s]"></div>
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
