"use client";

import { useState, useEffect, useRef } from "react";
import { CanvasElement } from "@/domain/entities";
import { fetchHandwritingFonts, loadFont, GoogleFont } from "@/infra/fonts/googleFontsService";

interface ToolHUDProps {
    activeTool: 'select' | 'draw' | 'arrow' | 'eraser' | 'hand';
    elements: CanvasElement[];
    selectedIds: string[];
    activeColor: string;
    activeStrokeWidth: number;
    activeFontFamily: string;
    handleColorSelect: (color: string) => void;
    handleStrokeWidthChange: (width: number) => void;
    handleFontChange: (font: string) => void;
}

const COLORS = [
    { name: 'Ink', value: '#1a1e26' },
    { name: 'Sage', value: '#8a9a86' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Pink', value: '#ec4899' },
];

const DEFAULT_FONT = "Inter";

export default function ToolHUD({
    activeTool,
    elements,
    selectedIds,
    activeColor,
    activeStrokeWidth,
    activeFontFamily,
    handleColorSelect,
    handleStrokeWidthChange,
    handleFontChange,
}: ToolHUDProps) {
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

    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const hasPostIt = selectedElements.some(el => el.type === 'text' && !!el.backgroundColor);
    const hasText = selectedElements.some(el => el.type === 'text' && !el.backgroundColor);
    const hasLines = selectedElements.some(el => el.type === 'line' || el.type === 'arrow');
    const hasEraser = selectedElements.some(el => el.type === 'eraser');
    const isDrawingTool = activeTool === 'draw' || activeTool === 'arrow' || activeTool === 'eraser';
    const hasTextElement = hasPostIt || hasText;

    const showHUD = isDrawingTool || selectedIds.length > 0;
    if (!showHUD) return null;

    const showColor = (activeTool !== 'eraser' && !hasEraser) && (isDrawingTool || hasPostIt || hasText || hasLines);
    const showThickness = isDrawingTool || hasLines || hasEraser;
    const showFont = hasTextElement && activeTool === 'select';

    if (!showColor && !showThickness && !showFont) return null;

    let colorLabel = "Couleur";
    if (hasPostIt && !hasText && !hasLines && activeTool === 'select') colorLabel = "Couleur Papier";
    else if (hasText && !hasPostIt && !hasLines && activeTool === 'select') colorLabel = "Couleur Encre";

    const currentFont = activeFontFamily || DEFAULT_FONT;

    const openFontPicker = async () => {
        setFontPickerOpen(true);
        if (fonts.length === 0) {
            setFontsLoading(true);
            const result = await fetchHandwritingFonts();
            setFonts(result);
            setFontsLoading(false);
            // Preload the first 20 fonts for preview
            result.slice(0, 20).forEach(f => loadFont(f.family));
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
        <div className="flex flex-col gap-3 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-black/5 shadow-xl animate-in fade-in slide-in-from-left-4 duration-200 pointer-events-auto w-44 h-fit relative">
            {showColor && (
                <>
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider mb-1">{colorLabel}</p>
                        <div className="grid grid-cols-3 gap-2">
                            {COLORS.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => handleColorSelect(color.value)}
                                    className={`size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 ${activeColor === color.value ? 'border-ink scale-110 shadow-md' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                            <div
                                className={`relative size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 overflow-hidden flex items-center justify-center ${!COLORS.some(c => c.value === activeColor) ? 'border-ink scale-110 shadow-md' : 'border-transparent'}`}
                                style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                                title="Couleur personnalisée"
                            >
                                <input
                                    type="color"
                                    value={activeColor}
                                    onChange={(e) => handleColorSelect(e.target.value)}
                                    className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0"
                                />
                            </div>
                        </div>
                    </div>
                    {(showThickness || showFont) && <div className="h-px w-full bg-ink/5 my-1" />}
                </>
            )}

            {showThickness && (
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-bold text-ink-light uppercase tracking-wider mb-1">
                        {activeTool === 'eraser' || (selectedIds.length > 0 && selectedElements.every(el => el.type === 'eraser')) ? 'Taille gomme' : 'Épaisseur'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {[2, 4, 8, 16].map((w) => (
                            <button
                                key={w}
                                onClick={() => handleStrokeWidthChange(w)}
                                className={`size-10 rounded-xl flex items-center justify-center transition-all ${activeStrokeWidth === w ? 'bg-sage text-white shadow-sm' : 'text-ink-light hover:bg-black/5'}`}
                            >
                                <div
                                    className="rounded-full bg-current transition-all"
                                    style={{ width: w, height: w }}
                                />
                            </button>
                        ))}
                    </div>
                    {showFont && <div className="h-px w-full bg-ink/5 my-1" />}
                </div>
            )}

            {showFont && (
                <div className="flex flex-col gap-2">
                    <div ref={fontPickerRef} className="relative">
                        <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider mb-1">Police</p>
                        <button
                            onClick={fontPickerOpen ? () => setFontPickerOpen(false) : openFontPicker}
                            className="w-full text-left px-3 py-2.5 rounded-xl bg-paper/60 border border-paper-dark text-sm text-ink hover:bg-paper transition-colors"
                            style={{ fontFamily: `"${currentFont}", cursive, sans-serif` }}
                        >
                            {currentFont}
                        </button>

                        {fontPickerOpen && (
                            <div className="absolute right-full mr-2 top-0 w-72 bg-white/95 backdrop-blur-xl rounded-2xl border border-black/5 shadow-2xl p-3 flex flex-col gap-2 z-50 max-h-[420px]">
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={fontSearch}
                                    onChange={(e) => {
                                        setFontSearch(e.target.value);
                                        // Load visible fonts on search
                                        const matches = fonts.filter(f =>
                                            f.family.toLowerCase().includes(e.target.value.toLowerCase())
                                        );
                                        matches.slice(0, 15).forEach(f => loadFont(f.family));
                                    }}
                                    className="w-full px-3 py-2 text-xs border border-paper-dark rounded-xl bg-paper/30 outline-none focus:border-sage transition-colors"
                                    autoFocus
                                />
                                {fontsLoading ? (
                                    <p className="text-[10px] text-ink-light text-center py-4">Chargement...</p>
                                ) : (
                                    <div
                                        className="overflow-y-auto flex flex-col gap-0.5 max-h-[340px] scrollbar-thin"
                                        onScroll={(e) => {
                                            const target = e.currentTarget;
                                            const scrollRatio = target.scrollTop / (target.scrollHeight - target.clientHeight || 1);
                                            const startIdx = Math.floor(scrollRatio * filteredFonts.length);
                                            filteredFonts.slice(startIdx, startIdx + 15).forEach(f => loadFont(f.family));
                                        }}
                                    >
                                        {filteredFonts.map(font => (
                                            <button
                                                key={font.family}
                                                onClick={() => selectFont(font.family)}
                                                className={`w-full text-left px-3 py-2.5 rounded-lg text-base transition-colors ${currentFont === font.family ? 'bg-sage/10 text-sage font-semibold' : 'hover:bg-paper/60 text-ink'}`}
                                                style={{ fontFamily: `"${font.family}", cursive` }}
                                                onMouseEnter={() => loadFont(font.family)}
                                            >
                                                {font.family}
                                            </button>
                                        ))}
                                        {filteredFonts.length === 0 && (
                                            <p className="text-[10px] text-ink-light text-center py-4">Aucune police trouvée</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
