import React, { useState } from 'react';
import { Scrapbook } from '@/domain/entities';
import { MiniCanvasPreview } from './MiniCanvasPreview';

interface BookBinderProps {
    scrapbook: Partial<Scrapbook>;
    onClick?: () => void;
    onOpenStart?: () => void;
    interactive?: boolean;
    className?: string;
    style?: React.CSSProperties;
    showDetails?: boolean;
}

export const BookBinder: React.FC<BookBinderProps> = ({
    scrapbook,
    onClick,
    onOpenStart,
    interactive = true,
    className = "",
    style = {},
    showDetails = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = () => {
        if (!interactive || isOpen) return;
        setIsOpen(true);
        if (onOpenStart) onOpenStart();

        if (onClick) {
            // Delay navigation to let animation play and allow user to see the preview
            setTimeout(() => {
                onClick();
                // Reset after a while in case we come back via browser back button
                setTimeout(() => setIsOpen(false), 500);
            }, 1000);
        }
    };

    const binderColor = scrapbook.binderColor || '#e8e4dc';
    const binderGrain = scrapbook.binderGrain ?? 0.1;

    // Use a group class specifically for hover effects on child elements like the 'Ouvrir' badge
    return (
        <div className={`book-container group/book w-full h-full ${className}`} style={style}>
            <div
                className={`book ${interactive ? 'interactive' : ''} ${isOpen ? 'open' : ''} relative w-full h-full`}
                onClick={handleClick}
            >
                {/* Back Cover */}
                <div className="back absolute inset-0 rounded-r-2xl rounded-l-sm shadow-xl overflow-hidden" style={{ backgroundColor: binderColor }}>
                    <div className="absolute inset-0 binder-grain mix-blend-multiply pointer-events-none" style={{ opacity: binderGrain }}></div>
                </div>

                {/* Page 1 (Top page when opened - contains Preview) */}
                <div className="page page1 absolute top-[2%] bottom-[2%] left-1 right-2 bg-[#fdfcf9] border-y border-r border-black/5 rounded-r-md overflow-hidden flex flex-col items-center justify-center p-3">
                    <div className="absolute inset-0 binder-grain mix-blend-multiply opacity-10 pointer-events-none z-0"></div>

                    <div className={`relative z-10 w-full h-full border-2 border-dashed border-sage/20 rounded-lg p-2 bg-sage/5 overflow-hidden transition-opacity duration-700 ${isOpen ? 'opacity-100 delay-100' : 'opacity-0'}`}>
                        <MiniCanvasPreview scrapbookId={scrapbook.id!} isActive={isOpen} />
                    </div>
                </div>

                {/* Pages 2 to 6 */}
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`page page${i + 2} absolute top-[2%] bottom-[2%] left-1 right-2 bg-[#fdfcf9] border-y border-r border-black/5 rounded-r-md overflow-hidden`}>
                        <div className="absolute inset-0 binder-grain mix-blend-multiply opacity-10 pointer-events-none"></div>
                    </div>
                ))}

                {/* Front Cover */}
                <div className="front absolute inset-0 rounded-r-2xl rounded-l-sm shadow-xl border-l-[12px] border-l-black/20 overflow-hidden" style={{ backgroundColor: binderColor }}>
                    {/* Leather Texture */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-10 mix-blend-overlay z-10"></div>

                    {/* Grain Texture */}
                    <div className="absolute inset-0 binder-grain mix-blend-multiply pointer-events-none z-10 transition-opacity duration-300" style={{ opacity: binderGrain }}></div>

                    {/* Spine shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10"></div>

                    {/* Metal Rings */}
                    <div className="absolute left-0 top-[12%] bottom-[12%] flex flex-col justify-between py-4 z-30 pointer-events-none">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex flex-col gap-[2px]">
                                <div className="w-5 h-1.5 bg-gradient-to-r from-[#9ca3af] via-[#f3f4f6] to-[#6b7280] shadow-[2px_2px_3px_rgba(0,0,0,0.4)] rounded-r-sm border border-[#4b5563]/30"></div>
                                <div className="w-5 h-1.5 bg-gradient-to-r from-[#9ca3af] via-[#f3f4f6] to-[#6b7280] shadow-[2px_2px_3px_rgba(0,0,0,0.4)] rounded-r-sm border border-[#4b5563]/30"></div>
                            </div>
                        ))}
                    </div>

                    {/* Elastic Band */}
                    <div className="absolute right-4 top-0 bottom-0 w-3 bg-[#1a1e26] shadow-[inset_1px_0_2px_rgba(255,255,255,0.2),-2px_0_5px_rgba(0,0,0,0.5)] z-40">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/woven-light.png')] opacity-30 mix-blend-overlay"></div>
                    </div>

                    {/* Cover Image if any */}
                    {scrapbook.coverImage && (
                        <div className="absolute inset-0 z-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={scrapbook.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60 mix-blend-multiply" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
                        </div>
                    )}

                    {/* Title Plate */}
                    {showDetails && scrapbook.title && (
                        <div className={`absolute top-12 left-1/2 -translate-x-1/2 ${binderColor === '#1a1e26' || binderColor === '#3a4a3a' ? 'bg-white text-ink' : 'bg-white/95 text-ink'} px-4 py-3 shadow-sm border border-black/5 rotate-1 min-w-[140px] max-w-[90%] text-center z-20`}>
                            <h3 className="font-serif text-lg font-semibold truncate">{scrapbook.title || "Sans Titre"}</h3>
                            {scrapbook.createdAt && (
                                <p className="text-[10px] text-ink-light mt-1 font-mono uppercase tracking-widest opacity-60">
                                    {new Date(scrapbook.createdAt).toLocaleDateString()}
                                </p>
                            )}
                            {!scrapbook.createdAt && (
                                <p className="text-[8px] text-ink-light mt-1 font-mono uppercase tracking-widest opacity-60">Prévisualisation</p>
                            )}
                        </div>
                    )}

                    {/* Hover text (Ouvrir) */}
                    {interactive && (
                        <div className="absolute bottom-0 w-full h-1/2 flex items-end justify-center pb-8 opacity-0 group-hover/book:opacity-100 transition-opacity duration-500 z-50 pointer-events-none">
                            <span className="bg-sage text-white px-6 py-2 rounded-full text-sm font-medium shadow-md transition-transform transform group-hover/book:-translate-y-2">Ouvrir</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
