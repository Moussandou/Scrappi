"use client";

import { useState, useEffect, useRef } from "react";
import { CanvasElement } from "@/domain/entities";
import { fetchHandwritingFonts, loadFont, GoogleFont } from "@/infra/fonts/googleFontsService";
import { PaperType } from "./PaperSelector";

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
    onDelete: () => void;
    onMoveZ: (direction: 'forward' | 'backward' | 'front' | 'back') => void;
    paperType: PaperType;
    onPaperTypeChange: (type: PaperType) => void;
    paperColor: string;
    onPaperColorChange: (color: string) => void;
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
    onDelete,
    onMoveZ,
    paperType,
    onPaperTypeChange,
    paperColor,
    onPaperColorChange
}: ToolHUDProps) {
    const [fontPickerOpen, setFontPickerOpen] = useState(false);
    const [fonts, setFonts] = useState<GoogleFont[]>([]);
    const [fontSearch, setFontSearch] = useState("");
    const [fontsLoading, setFontsLoading] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        paper: true,
        layers: true,
        color: true,
        thickness: true,
        font: true
    });
    const fontPickerRef = useRef<HTMLDivElement>(null);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

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

    const showColor = (activeTool !== 'eraser' && !hasEraser) && (isDrawingTool || hasPostIt || hasText || hasLines);
    const showThickness = isDrawingTool || hasLines || hasEraser;
    const showFont = hasTextElement && activeTool === 'select';
    const showActions = selectedIds.length > 0 && activeTool === 'select';
    const showPaper = activeTool === 'select' && selectedIds.length === 0;

    const showHUD = showColor || showThickness || showFont || showActions || showPaper;
    if (!showHUD) return null;

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

    const SectionHeader = ({ id, label, isLast = false }: { id: string, label: string, isLast?: boolean }) => (
        <div
            className="flex items-center justify-between cursor-pointer group/header"
            onClick={() => toggleSection(id)}
        >
            <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider">{label}</p>
            <span className={`material-symbols-outlined text-[16px] text-ink-light transition-transform duration-200 ${expandedSections[id] ? '' : '-rotate-90'}`}>
                expand_more
            </span>
        </div>
    );

    return (
        <div className="flex flex-col gap-2.5 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-black/5 shadow-xl animate-in fade-in slide-in-from-left-4 duration-200 pointer-events-auto w-36 h-fit relative">
            {showPaper && (
                <div className="flex flex-col gap-2">
                    <SectionHeader id="paper" label="Papier" />
                    {expandedSections.paper && (
                        <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="grid grid-cols-2 gap-1.5">
                                {[
                                    { id: 'standard', icon: 'texture', label: 'Std', title: 'Grain fin 800DPI' },
                                    { id: 'canson', icon: 'draw', label: 'Can', title: 'Papier artistique poreux' },
                                    { id: 'watercolor', icon: 'water_drop', label: 'Aq', title: 'Grain aquarelle épais' },
                                    { id: 'kraft', icon: 'package_2', label: 'Kr', title: 'Papier Kraft recyclé' },
                                ].map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => onPaperTypeChange(p.id as PaperType)}
                                        className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${paperType === p.id ? 'bg-sage text-white shadow-sm' : 'text-ink-light hover:bg-black/5'}`}
                                        title={p.title}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">{p.icon}</span>
                                        <span className="text-[9px] font-bold">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-1">
                                <div
                                    className="size-5 rounded-full border border-black/10 flex-shrink-0 relative overflow-hidden flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                                    style={{ background: paperColor || '#f8f5f0' }}
                                    title="Teinte du papier"
                                >
                                    <input
                                        type="color"
                                        value={paperColor || '#f8f5f0'}
                                        onChange={(e) => onPaperColorChange(e.target.value)}
                                        className="absolute inset-[-5px] w-8 h-8 opacity-0 cursor-pointer"
                                    />
                                    {!paperColor && <span className="material-symbols-outlined text-[12px] text-ink/20">palette</span>}
                                </div>
                                <span className="text-[9px] font-bold text-ink-light truncate">Couleur fond</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showActions && (
                <div className="flex flex-col gap-2">
                    <SectionHeader id="layers" label="Ordre" />
                    {expandedSections.layers && (
                        <div className="grid grid-cols-2 gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={() => onMoveZ('front')}
                                className="size-9 rounded-xl flex items-center justify-center text-ink-light hover:bg-black/5 transition-all"
                                title="Mettre au premier plan"
                            >
                                <span className="material-symbols-outlined text-[20px]">flip_to_front</span>
                            </button>
                            <button
                                onClick={() => onMoveZ('forward')}
                                className="size-9 rounded-xl flex items-center justify-center text-ink-light hover:bg-black/5 transition-all"
                                title="Avancer d'un niveau"
                            >
                                <span className="material-symbols-outlined text-[20px]">layers</span>
                            </button>
                            <button
                                onClick={() => onMoveZ('backward')}
                                className="size-9 rounded-xl flex items-center justify-center text-ink-light hover:bg-black/5 transition-all"
                                title="Reculer d'un niveau"
                            >
                                <span className="material-symbols-outlined text-[20px]">layers_clear</span>
                            </button>
                            <button
                                onClick={() => onMoveZ('back')}
                                className="size-9 rounded-xl flex items-center justify-center text-ink-light hover:bg-black/5 transition-all"
                                title="Mettre à l'arrière plan"
                            >
                                <span className="material-symbols-outlined text-[20px]">flip_to_back</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showColor && (
                <div className="flex flex-col gap-2">
                    {showActions && <div className="h-px w-full bg-ink/5 my-0.5" />}
                    <SectionHeader id="color" label={colorLabel} />
                    {expandedSections.color && (
                        <div className="grid grid-cols-3 gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                            {COLORS.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => handleColorSelect(color.value)}
                                    className={`size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 ${activeColor === color.value ? 'border-ink scale-110 shadow-sm' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.value }}
                                    title={`Couleur : ${color.name}`}
                                />
                            ))}
                            <div
                                className={`relative size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 overflow-hidden flex items-center justify-center ${!COLORS.some(c => c.value === activeColor) ? 'border-ink scale-110 shadow-sm' : 'border-transparent'}`}
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
                    )}
                </div>
            )}

            {showThickness && (
                <div className="flex flex-col gap-2">
                    {(showActions || showColor) && <div className="h-px w-full bg-ink/5 my-0.5" />}
                    <SectionHeader id="thickness" label={activeTool === 'eraser' || (selectedIds.length > 0 && selectedElements.every(el => el.type === 'eraser')) ? 'Gomme' : 'Taille'} />
                    {expandedSections.thickness && (
                        <div className="grid grid-cols-2 gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                            {[2, 4, 8, 16].map((w) => (
                                <button
                                    key={w}
                                    onClick={() => handleStrokeWidthChange(w)}
                                    className={`size-9 rounded-xl flex items-center justify-center transition-all ${activeStrokeWidth === w ? 'bg-sage text-white shadow-sm' : 'text-ink-light hover:bg-black/5'}`}
                                    title={`Épaisseur : ${w}px`}
                                >
                                    <div
                                        className="rounded-full bg-current transition-all"
                                        style={{ width: w / 1.5, height: w / 1.5 }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showFont && (
                <div className="flex flex-col gap-2">
                    {(showActions || showColor || showThickness) && <div className="h-px w-full bg-ink/5 my-0.5" />}
                    <SectionHeader id="font" label="Police" />
                    {expandedSections.font && (
                        <div ref={fontPickerRef} className="relative animate-in fade-in zoom-in-95 duration-200">
                            <button
                                onClick={fontPickerOpen ? () => setFontPickerOpen(false) : openFontPicker}
                                className="w-full text-left px-2 py-2 rounded-xl bg-paper/60 border border-paper-dark text-[11px] text-ink hover:bg-paper transition-colors truncate"
                                style={{ fontFamily: `"${currentFont}", cursive, sans-serif` }}
                                title="Changer la police d'écriture"
                            >
                                {currentFont}
                            </button>

                            {fontPickerOpen && (
                                <div className="absolute right-full mr-2 top-0 w-64 bg-white/95 backdrop-blur-xl rounded-2xl border border-black/5 shadow-2xl p-2 flex flex-col gap-1.5 z-50 max-h-[380px]">
                                    <input
                                        type="text"
                                        placeholder="Rechercher..."
                                        value={fontSearch}
                                        onChange={(e) => {
                                            setFontSearch(e.target.value);
                                            const matches = fonts.filter(f => f.family.toLowerCase().includes(e.target.value.toLowerCase()));
                                            matches.slice(0, 15).forEach(f => loadFont(f.family));
                                        }}
                                        className="w-full px-2 py-1.5 text-xs border border-paper-dark rounded-xl bg-paper/30 outline-none focus:border-sage transition-colors"
                                        autoFocus
                                    />
                                    {fontsLoading ? (
                                        <p className="text-[10px] text-ink-light text-center py-4">Chargement...</p>
                                    ) : (
                                        <div
                                            className="overflow-y-auto flex flex-col gap-0.5 max-h-[300px] scrollbar-thin"
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
                                                    className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${currentFont === font.family ? 'bg-sage/10 text-sage font-semibold' : 'hover:bg-paper/60 text-ink'}`}
                                                    style={{ fontFamily: `"${font.family}", cursive` }}
                                                >
                                                    {font.family}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
