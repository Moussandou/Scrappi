"use client";

import { useEffect, useState, useRef } from "react";
import { CanvasElement } from "@/domain/entities";
import { TOOL_HUD_COLORS, DEFAULT_FONT } from "../constants";
import { fetchHandwritingFonts, loadFont, loadFonts, GoogleFont } from "@/infra/fonts/googleFontsService";

interface FloatingContextHUDProps {
    selectedElements: CanvasElement[];
    activeColor: string;
    activeStrokeWidth: number;
    activeFontFamily: string;
    handleColorSelect: (color: string) => void;
    handleStrokeWidthChange: (width: number) => void;
    handleFontChange: (font: string) => void;
    onDelete: () => void;
    onMoveZ: (direction: 'forward' | 'backward' | 'front' | 'back') => void;
    onUpdateElement?: (id: string, props: Partial<CanvasElement>) => void;
}

export default function FloatingContextHUD({
    selectedElements,
    activeColor,
    activeStrokeWidth,
    activeFontFamily,
    handleColorSelect,
    handleStrokeWidthChange,
    handleFontChange,
    onDelete,
    onMoveZ,
    onUpdateElement
}: FloatingContextHUDProps) {
    const [fontPickerOpen, setFontPickerOpen] = useState(false);
    const [fonts, setFonts] = useState<GoogleFont[]>([]);
    const [fontSearch, setFontSearch] = useState("");
    const [fontsLoading, setFontsLoading] = useState(false);
    const fontPickerRef = useRef<HTMLDivElement>(null);

    // Close font picker on click outside
    useEffect(() => {
        if (!fontPickerOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (fontPickerRef.current && !fontPickerRef.current.contains(e.target as Node)) {
                setFontPickerOpen(false);
                setFontSearch("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [fontPickerOpen]);

    if (selectedElements.length === 0) return null;

    const hasPostIt = selectedElements.some(el => el.type === 'text' && !!el.backgroundColor);
    const hasText = selectedElements.some(el => el.type === 'text' && !el.backgroundColor);
    const hasLines = selectedElements.some(el => el.type === 'line' || el.type === 'arrow');
    const hasEraser = selectedElements.some(el => el.type === 'eraser');
    const hasVideo = selectedElements.some(el => el.type === 'video');
    const firstVideo = selectedElements.find(el => el.type === 'video');

    const showColor = !hasEraser && (hasPostIt || hasText || hasLines);
    const showThickness = hasLines || hasEraser;
    const showFont = (hasPostIt || hasText);
    const showVideo = hasVideo;

    const currentFont = activeFontFamily || DEFAULT_FONT;

    const openFontPicker = async () => {
        setFontPickerOpen(true);
        if (fonts.length === 0) {
            setFontsLoading(true);
            const result = await fetchHandwritingFonts();
            setFonts(result);
            setFontsLoading(false);
            loadFonts(result.slice(0, 20).map(f => f.family));
        }
    };

    const filteredFonts = fonts.filter(f =>
        f.family.toLowerCase().includes(fontSearch.toLowerCase())
    );

    const selectFont = (family: string) => {
        loadFont(family);
        handleFontChange(family);
        setFontPickerOpen(false);
        setFontSearch("");
    };

    return (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-32 z-[100] transition-all animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl p-2 flex items-center gap-1.5 pointer-events-auto">

                {/* Z-Index Controls */}
                <div className="flex items-center bg-black/5 rounded-xl p-1 gap-1 mr-1">
                    <button onClick={() => onMoveZ('front')} className="p-1.5 hover:bg-white rounded-lg transition-all text-ink-light hover:text-ink" title="Premier plan">
                        <span className="material-symbols-outlined text-[18px]">flip_to_front</span>
                    </button>
                    <button onClick={() => onMoveZ('back')} className="p-1.5 hover:bg-white rounded-lg transition-all text-ink-light hover:text-ink" title="Arrière plan">
                        <span className="material-symbols-outlined text-[18px]">flip_to_back</span>
                    </button>
                </div>

                {/* Color Picker */}
                {showColor && (
                    <div className="flex items-center gap-1 px-1 border-r border-black/5 mr-1">
                        <div className="relative size-7 rounded-full overflow-hidden border border-black/5 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-inner" style={{ backgroundColor: activeColor }}>
                            <input
                                type="color"
                                value={activeColor}
                                onChange={(e) => handleColorSelect(e.target.value)}
                                className="absolute inset-[-5px] w-10 h-10 opacity-0 cursor-pointer"
                            />
                            {!activeColor && <span className="material-symbols-outlined text-xs text-ink/20">palette</span>}
                        </div>
                    </div>
                )}

                {/* Font Picker */}
                {showFont && (
                    <div className="relative border-r border-black/5 pr-2 mr-1" ref={fontPickerRef}>
                        <button
                            onClick={fontPickerOpen ? () => setFontPickerOpen(false) : openFontPicker}
                            className="h-8 px-3 rounded-xl bg-black/5 hover:bg-black/10 transition-all text-[11px] font-bold text-ink flex items-center gap-2 min-w-[100px]"
                            style={{ fontFamily: `"${currentFont}", cursive` }}
                        >
                            <span className="truncate">{currentFont}</span>
                            <span className="material-symbols-outlined text-[14px]">expand_more</span>
                        </button>

                        {fontPickerOpen && (
                            <div className="absolute bottom-full left-0 mb-3 w-48 bg-white/95 backdrop-blur-xl rounded-2xl border border-black/5 shadow-2xl p-2 flex flex-col gap-1 z-[101] max-h-[300px]">
                                <input
                                    type="text"
                                    placeholder="Chercher..."
                                    value={fontSearch}
                                    onChange={(e) => setFontSearch(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-paper-dark rounded-xl bg-paper/30 outline-none focus:border-sage transition-colors mb-1"
                                    autoFocus
                                />
                                <div className="overflow-y-auto flex flex-col gap-0.5 max-h-[240px] scrollbar-thin">
                                    {filteredFonts.map(font => (
                                        <button
                                            key={font.family}
                                            onClick={() => selectFont(font.family)}
                                            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors ${currentFont === font.family ? 'bg-sage/10 text-sage font-semibold' : 'hover:bg-paper/60 text-ink'}`}
                                            style={{ fontFamily: `"${font.family}", cursive` }}
                                        >
                                            {font.family}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Stroke Width Picker */}
                {showThickness && (
                    <div className="flex items-center bg-black/5 rounded-xl p-1 gap-1 mr-1">
                        {[2, 4, 8, 16].map((w) => (
                            <button
                                key={w}
                                onClick={() => handleStrokeWidthChange(w)}
                                className={`size-7 rounded-lg flex items-center justify-center transition-all ${activeStrokeWidth === w ? 'bg-white text-ink shadow-sm' : 'text-ink-light hover:text-ink hover:bg-white/50'}`}
                            >
                                <div className="rounded-full bg-current" style={{ width: (w / 2.5 + 2) + 'px', height: (w / 2.5 + 2) + 'px' }} />
                            </button>
                        ))}
                    </div>
                )}

                {/* Video Controls */}
                {showVideo && firstVideo && (
                    <div className="flex items-center gap-1 border-r border-black/5 pr-2 mr-1">
                        <button
                            onClick={() => onUpdateElement?.(firstVideo.id, { autoPlay: firstVideo.autoPlay === false })}
                            className="p-1.5 hover:bg-black/5 rounded-lg transition-all text-ink-light hover:text-sage"
                        >
                            <span className="material-symbols-outlined text-[20px]">{firstVideo.autoPlay !== false ? 'pause' : 'play_arrow'}</span>
                        </button>
                        <button
                            onClick={() => onUpdateElement?.(firstVideo.id, { muted: firstVideo.muted === false })}
                            className="p-1.5 hover:bg-black/5 rounded-lg transition-all text-ink-light hover:text-sage"
                        >
                            <span className="material-symbols-outlined text-[20px]">{firstVideo.muted !== false ? 'volume_off' : 'volume_up'}</span>
                        </button>
                    </div>
                )}

                {/* Delete Button */}
                <button
                    onClick={onDelete}
                    className="size-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all ml-1"
                    title="Supprimer"
                >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        </div>
    );
}
