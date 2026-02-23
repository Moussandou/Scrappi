"use client";

import { useEffect, useState, useRef } from "react";
import { pixabayService, PixabayImage } from "@/infra/pixabay/pixabayService";

interface StickerTrayProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSticker: (url: string) => void;
}

export default function StickerTray({ isOpen, onClose, onSelectSticker }: StickerTrayProps) {
    const [stickers, setStickers] = useState<PixabayImage[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Initial load: trending illustrations
        loadStickers("");
    }, [isOpen]);

    const loadStickers = async (query: string) => {
        setIsLoading(true);
        try {
            const results = await pixabayService.searchImages(query);
            setStickers(results);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            loadStickers(value);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-8 top-24 bottom-24 w-80 bg-white/80 backdrop-blur-md rounded-2xl shadow-soft border border-black/5 flex flex-col z-50 overflow-hidden animate-in slide-in-from-right-8 duration-300 pointer-events-auto">
            <header className="px-5 py-4 border-b border-black/5 shrink-0 bg-white/50 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-sage">palette</span>
                        <h3 className="font-bold text-ink">Illustrations</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 flex items-center justify-center rounded-full hover:bg-black/5 text-ink-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-ink-light">search</span>
                    <input
                        type="text"
                        placeholder="Botanique, papier, vintage..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full h-10 pl-10 pr-4 bg-white border border-paper-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage/30 transition-all text-ink placeholder:text-ink-light/50 shadow-inner-sm"
                    />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isLoading ? (
                    <div className="grid grid-cols-2 gap-4 animate-pulse">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="aspect-square bg-black/5 rounded-xl" />
                        ))}
                    </div>
                ) : stickers.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {stickers.map((img) => (
                            <button
                                key={img.id}
                                onClick={() => {
                                    onSelectSticker(img.webformatURL);
                                    onClose();
                                }}
                                className="aspect-square relative rounded-xl border border-black/5 bg-white shadow-soft hover:shadow-md hover:scale-105 transition-all overflow-hidden group p-2"
                                title={img.tags}
                            >
                                <img
                                    src={img.previewURL}
                                    alt={img.tags}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                    crossOrigin="anonymous"
                                />
                                <div className="absolute inset-0 bg-sage/0 group-hover:bg-sage/5 transition-colors" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-ink-light text-center px-4 space-y-2">
                        <span className="material-symbols-outlined text-4xl opacity-20">sentiment_dissatisfied</span>
                        <p className="text-sm">Aucune illustration trouvée pour &quot;{searchTerm}&quot;</p>
                    </div>
                )}
            </div>

            <footer className="px-4 py-2 bg-white/30 border-t border-black/5">
                <p className="text-[10px] text-ink-light text-center">Images par <span className="font-bold">Pixabay</span></p>
            </footer>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.1);
                    border-radius: 20px;
                }
                .shadow-inner-sm {
                    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
                }
            `}</style>
        </div>
    );
}
