"use client";

import React from 'react';

export type PaperType = 'standard' | 'canson' | 'watercolor' | 'kraft';

interface PaperSelectorProps {
    value: PaperType;
    onChange: (type: PaperType) => void;
}

const papers: { type: PaperType; label: string; icon: string; description: string }[] = [
    { type: 'standard', label: 'Standard', icon: 'texture', description: 'Grain 800DPI fin' },
    { type: 'canson', label: 'Canson', icon: 'draw', description: 'Papier artistique' },
    { type: 'watercolor', label: 'Aquarelle', icon: 'water_drop', description: 'Texture bosselée' },
    { type: 'kraft', label: 'Kraft', icon: 'package_2', description: 'Papier recyclé' },
];

export const PaperSelector: React.FC<PaperSelectorProps> = ({ value, onChange }) => {
    return (
        <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-soft border border-black/5 pointer-events-auto">
            <div className="flex items-center gap-2 px-1 mb-1">
                <span className="material-symbols-outlined text-[18px] text-sage">description</span>
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">Papier</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
                {papers.map((paper) => (
                    <button
                        key={paper.type}
                        onClick={() => onChange(paper.type)}
                        className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${value === paper.type
                                ? 'bg-sage text-white shadow-sm'
                                : 'hover:bg-black/5 text-ink-light'
                            }`}
                    >
                        <span className={`material-symbols-outlined text-[20px] ${value === paper.type ? 'text-white' : 'text-sage'
                            }`}>
                            {paper.icon}
                        </span>
                        <div className="flex flex-col items-start">
                            <span className="text-[12px] font-bold leading-tight">{paper.label}</span>
                            <span className={`text-[9px] leading-tight opacity-70 ${value === paper.type ? 'text-white/80' : 'text-ink-light/60'
                                }`}>
                                {paper.description}
                            </span>
                        </div>

                        {/* Selected Indicator */}
                        {value === paper.type && (
                            <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
