"use client";

import { useState, useEffect, useRef } from "react";
import { CanvasElement } from "@/domain/entities";
import { fetchHandwritingFonts, loadFont, loadFonts, GoogleFont } from "@/infra/fonts/googleFontsService";
import { PaperType } from "./PaperSelector";
import { TOOL_HUD_COLORS, DEFAULT_FONT } from "../constants";
import { UseStorageModeReturn } from "../hooks/useStorageMode";

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
    onUpdateElement?: (id: string, props: Partial<CanvasElement>) => void;
    paperType: PaperType;
    onPaperTypeChange: (type: PaperType) => void;
    paperColor: string;
    onPaperColorChange: (color: string) => void;
    storageMode: UseStorageModeReturn;
}

const SectionHeader = ({ id, label, expanded, onToggle }: { id: string, label: string, expanded: boolean, onToggle: (id: string) => void }) => (
    <div
        className="flex items-center justify-between cursor-pointer group/header"
        onClick={() => onToggle(id)}
    >
        <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider">{label}</p>
        <span className={`material-symbols-outlined text-[16px] text-ink-light transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}>
            expand_more
        </span>
    </div>
);

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
    onUpdateElement,
    paperType,
    onPaperTypeChange,
    paperColor,
    onPaperColorChange,
    storageMode
}: ToolHUDProps) {
    const [fontPickerOpen, setFontPickerOpen] = useState(false);
    const [fonts, setFonts] = useState<GoogleFont[]>([]);
    const [fontSearch, setFontSearch] = useState("");
    const [fontsLoading, setFontsLoading] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        storage: true,
        paper: true,
        layers: true,
        color: true,
        thickness: true,
        font: true,
        video: true
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
    const hasVideo = selectedElements.some(el => el.type === 'video');
    const firstVideo = selectedElements.find(el => el.type === 'video');

    const isDrawingTool = activeTool === 'draw' || activeTool === 'arrow' || activeTool === 'eraser';
    const hasTextElement = hasPostIt || hasText;

    const showColor = (activeTool !== 'eraser' && !hasEraser) && (isDrawingTool || hasPostIt || hasText || hasLines);
    const showThickness = isDrawingTool || hasLines || hasEraser;
    const showFont = hasTextElement && activeTool === 'select';
    const showVideo = hasVideo && activeTool === 'select';
    const showActions = selectedIds.length > 0 && activeTool === 'select';
    const showPaper = activeTool === 'select' && selectedIds.length === 0;

    // Always show storage options when nothing is selected (part of project settings)
    const showStorage = activeTool === 'select' && selectedIds.length === 0;

    const showHUD = showColor || showThickness || showFont || showActions || showPaper || showVideo || showStorage;
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
        <div className="fixed right-4 md:right-8 top-24 bottom-20 md:bottom-24 w-[calc(100%-2rem)] md:w-64 pointer-events-auto z-[50] flex flex-col">
            <div className={`bg-white/80 backdrop-blur-md rounded-2xl md:rounded-3xl shadow-soft border border-black/5 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'h-12' : 'h-full max-h-[70vh] md:max-h-full'}`}>
                {/* Header */}
                <header
                    className="p-4 flex items-center justify-between cursor-pointer shrink-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-sage">settings_input_component</span>
                        <h3 className="font-bold text-ink text-sm">Contrôles</h3>
                    </div>
                    <span className={`material-symbols-outlined text-[20px] text-ink-light transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                        keyboard_arrow_down
                    </span>
                </header>

                <div className={`flex-1 overflow-y-auto custom-scrollbar p-5 pt-0 space-y-6 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 invisible h-0' : 'opacity-100 visible'}`}>

                    {showStorage && (
                        <div className="flex flex-col gap-2">
                            <SectionHeader id="storage" label="Stockage" expanded={expandedSections.storage} onToggle={toggleSection} />
                            {expandedSections.storage && (
                                <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="flex items-center bg-black/5 rounded-xl p-1 gap-1">
                                        <button
                                            onClick={() => storageMode.setMode("cloud")}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${storageMode.mode === 'cloud' ? 'bg-white text-ink shadow-sm' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}
                                        >
                                            Cloud
                                        </button>
                                        <button
                                            onClick={() => storageMode.setMode("local")}
                                            disabled={!storageMode.isLocalSupported}
                                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${storageMode.mode === 'local' ? 'bg-white text-ink shadow-sm' : 'text-ink-light hover:text-ink hover:bg-black/5'} ${!storageMode.isLocalSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={!storageMode.isLocalSupported ? "Non supporté par ce navigateur" : "Stockage local"}
                                        >
                                            Local
                                        </button>
                                    </div>

                                    {storageMode.mode === 'local' && (
                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <div className="flex items-center justify-between px-1">
                                                <span className="text-[9px] font-bold text-ink-light">Dossier lié</span>
                                                <span className={`size-2 rounded-full ${storageMode.directoryReady ? 'bg-green-500' : 'bg-red-500'}`} title={storageMode.directoryReady ? "Connecté" : "Non connecté"} />
                                            </div>
                                            <button
                                                onClick={() => storageMode.changeDirectory()}
                                                className="w-full text-left px-2 py-1.5 bg-paper/50 hover:bg-paper border border-black/5 rounded-lg transition-colors flex items-center justify-between group relative"
                                                title={storageMode.directoryName || "Aucun dossier"}
                                            >
                                                <span className="text-[10px] text-ink truncate flex-1 pr-4 block">
                                                    {storageMode.directoryName || "Choisir..."}
                                                </span>
                                                <span className="material-symbols-outlined text-[14px] text-ink-light group-hover:text-sage transition-all absolute right-2">
                                                    folder_open
                                                </span>
                                            </button>
                                            {!storageMode.directoryReady && (
                                                <p className="text-[9px] text-red-500 px-1 leading-tight">
                                                    Permission requise ou dossier manquant.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="h-px w-full bg-ink/5 my-0.5" />
                        </div>
                    )}

                    {showPaper && (
                        <div className="flex flex-col gap-2">
                            <SectionHeader id="paper" label="Papier" expanded={expandedSections.paper} onToggle={toggleSection} />
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

                    {showVideo && firstVideo && (
                        <div className="flex flex-col gap-2">
                            <SectionHeader id="video" label="Vidéo" expanded={expandedSections.video} onToggle={toggleSection} />
                            {expandedSections.video && (
                                <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => onUpdateElement?.(firstVideo.id, { autoPlay: firstVideo.autoPlay === false })}
                                        className={`flex items-center justify-between w-full p-2 rounded-xl transition-all ${firstVideo.autoPlay !== false ? 'bg-sage/10 text-sage' : 'text-ink-light hover:bg-black/5'}`}
                                    >
                                        <span className="text-[10px] font-bold">Lecture</span>
                                        <span className="material-symbols-outlined text-[18px]">
                                            {firstVideo.autoPlay !== false ? 'pause_circle' : 'play_circle'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => onUpdateElement?.(firstVideo.id, { muted: firstVideo.muted === false })}
                                        className={`flex items-center justify-between w-full p-2 rounded-xl transition-all ${firstVideo.muted !== false ? 'bg-sage/10 text-sage' : 'text-ink-light hover:bg-black/5'}`}
                                    >
                                        <span className="text-[10px] font-bold">Muet</span>
                                        <span className="material-symbols-outlined text-[18px]">
                                            {firstVideo.muted !== false ? 'volume_off' : 'volume_up'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => onUpdateElement?.(firstVideo.id, { loop: firstVideo.loop === false })}
                                        className={`flex items-center justify-between w-full p-2 rounded-xl transition-all ${firstVideo.loop !== false ? 'bg-sage/10 text-sage' : 'text-ink-light hover:bg-black/5'}`}
                                    >
                                        <span className="text-[10px] font-bold">Boucle</span>
                                        <span className="material-symbols-outlined text-[18px]">
                                            {firstVideo.loop !== false ? 'repeat_on' : 'repeat'}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {showActions && (
                        <div className="flex flex-col gap-2">
                            <SectionHeader id="layers" label="Ordre" expanded={expandedSections.layers} onToggle={toggleSection} />
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
                            <SectionHeader id="color" label={colorLabel} expanded={expandedSections.color} onToggle={toggleSection} />
                            {expandedSections.color && (
                                <div className="grid grid-cols-3 gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                    {TOOL_HUD_COLORS.map(color => (
                                        <button
                                            key={color.name}
                                            onClick={() => handleColorSelect(color.value)}
                                            className={`size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 ${activeColor === color.value ? 'border-ink scale-110 shadow-sm' : 'border-transparent'}`}
                                            style={{ backgroundColor: color.value }}
                                            title={`Couleur : ${color.name}`}
                                        />
                                    ))}
                                    <div
                                        className={`relative size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 overflow-hidden flex items-center justify-center ${!TOOL_HUD_COLORS.some(c => c.value === activeColor) ? 'border-ink scale-110 shadow-sm' : 'border-transparent'}`}
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
                            <SectionHeader id="thickness" label={activeTool === 'eraser' || (selectedIds.length > 0 && selectedElements.every(el => el.type === 'eraser')) ? 'Gomme' : 'Taille'} expanded={expandedSections.thickness} onToggle={toggleSection} />
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
                                                style={{ width: (w / 1.5) + 'px', height: (w / 1.5) + 'px' }}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {showFont && (
                        <div className="flex flex-col gap-2">
                            <SectionHeader id="font" label="Police" expanded={expandedSections.font} onToggle={toggleSection} />
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
                                                    loadFonts(matches.slice(0, 15).map(f => f.family));
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
                                                        loadFonts(filteredFonts.slice(startIdx, startIdx + 15).map(f => f.family));
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

                {/* Footer status */}
                {!isCollapsed && (
                    <footer className="px-5 py-3 border-t border-black/5 bg-white shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[9px] text-ink-light font-bold uppercase tracking-wider">Connecté</span>
                            </div>
                            <span className="text-[9px] text-ink-light font-mono opacity-40 uppercase">Scrappi Engine</span>
                        </div>
                    </footer>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.1);
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
