"use client";

import { useState } from "react";
import { PaperType } from "./PaperSelector";
import { UseStorageModeReturn } from "../hooks/useStorageMode";

interface ProjectSidebarProps {
    paperType: PaperType;
    onPaperTypeChange: (type: PaperType) => void;
    paperColor: string;
    onPaperColorChange: (color: string) => void;
    storageMode: UseStorageModeReturn;
    isStickerTrayOpen: boolean;
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

export default function ProjectSidebar({
    paperType,
    onPaperTypeChange,
    paperColor,
    onPaperColorChange,
    storageMode,
    isStickerTrayOpen
}: ProjectSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        storage: true,
        paper: true
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // If sticker tray is open, we might want to hide or shift the sidebar on small screens
    // For now, let's keep it visible but aware.

    return (
        <div className="fixed right-4 md:right-8 top-24 bottom-24 w-64 pointer-events-auto z-[40] flex flex-col transition-all duration-300">
            <div className={`bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-soft border border-black/5 flex flex-col transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'h-14 opacity-60' : 'h-full max-h-[60vh] md:max-h-full opacity-100'}`}>

                {/* Header */}
                <header
                    className="p-5 flex items-center justify-between cursor-pointer shrink-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px] text-sage">auto_awesome_motion</span>
                        <h3 className="font-bold text-ink text-sm">Atelier</h3>
                    </div>
                    <span className={`material-symbols-outlined text-[20px] text-ink-light transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                        keyboard_arrow_down
                    </span>
                </header>

                <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 pt-0 space-y-8 transition-all duration-300 ${isCollapsed ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'}`}>

                    {/* Paper Settings */}
                    <div className="flex flex-col gap-3">
                        <SectionHeader id="paper" label="Papier & Fond" expanded={expandedSections.paper} onToggle={toggleSection} />
                        {expandedSections.paper && (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'standard', icon: 'texture', label: 'Std' },
                                        { id: 'canson', icon: 'brush', label: 'Canson' },
                                        { id: 'watercolor', icon: 'water_drop', label: 'Aqua' },
                                        { id: 'kraft', icon: 'inventory_2', label: 'Kraft' },
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => onPaperTypeChange(p.id as PaperType)}
                                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${paperType === p.id ? 'bg-sage border-sage text-white shadow-md' : 'bg-white/50 border-black/5 text-ink-light hover:border-black/10'}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                                            <span className="text-[10px] font-bold">{p.label}</span>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between p-3 bg-black/5 rounded-2xl">
                                    <span className="text-[10px] font-bold text-ink-light">Couleur du fond</span>
                                    <div className="relative size-6 rounded-full border border-white shadow-sm overflow-hidden" style={{ background: paperColor || '#ffffff' }}>
                                        <input
                                            type="color"
                                            value={paperColor || '#ffffff'}
                                            onChange={(e) => onPaperColorChange(e.target.value)}
                                            className="absolute inset-[-5px] w-10 h-10 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Storage Settings */}
                    <div className="flex flex-col gap-3">
                        <SectionHeader id="storage" label="Stockage" expanded={expandedSections.storage} onToggle={toggleSection} />
                        {expandedSections.storage && (
                            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-1 bg-black/5 rounded-2xl flex gap-1">
                                    <button
                                        onClick={() => storageMode.setMode("cloud")}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${storageMode.mode === 'cloud' ? 'bg-white text-ink shadow-sm' : 'text-ink-light hover:text-ink'}`}
                                    >
                                        Cloud
                                    </button>
                                    <button
                                        onClick={() => storageMode.setMode("local")}
                                        disabled={!storageMode.isLocalSupported}
                                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all ${storageMode.mode === 'local' ? 'bg-white text-ink shadow-sm' : 'text-ink-light hover:text-ink'} ${!storageMode.isLocalSupported ? 'opacity-30' : ''}`}
                                    >
                                        Local
                                    </button>
                                </div>

                                {storageMode.mode === 'local' && (
                                    <button
                                        onClick={() => storageMode.changeDirectory()}
                                        className="w-full p-3 bg-white border border-black/5 rounded-2xl flex items-center justify-between group hover:border-sage transition-all"
                                    >
                                        <div className="flex flex-col items-start overflow-hidden">
                                            <span className="text-[9px] font-bold text-ink-light uppercase tracking-tighter">Dossier</span>
                                            <span className="text-[10px] text-ink truncate w-full max-w-[120px]">{storageMode.directoryName || "Choisir..."}</span>
                                        </div>
                                        <span className={`material-symbols-outlined text-[20px] ${storageMode.directoryReady ? 'text-sage' : 'text-red-400 animate-pulse'}`}>
                                            {storageMode.directoryReady ? 'folder_managed' : 'folder_off'}
                                        </span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer status */}
                {!isCollapsed && (
                    <footer className="p-5 border-t border-black/5 bg-white/50 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="size-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                <span className="text-[9px] text-ink-light font-bold uppercase tracking-widest">Atelier Prêt</span>
                            </div>
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
                    background-color: rgba(0,0,0,0.05);
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
