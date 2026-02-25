"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Scrapbook } from "@/domain/entities";

interface EditorHeaderProps {
    scrapbook: Scrapbook | null;
    isEditingTitle: boolean;
    tempTitle: string;
    setTempTitle: (title: string) => void;
    setIsEditingTitle: (isEditing: boolean) => void;
    handleTitleUpdate: () => Promise<void>;
    handleUndo: () => void;
    handleRedo: () => void;
    historyStep: number;
    historyLength: number;
    pastStates: any[];
    futureStates: any[];
    currentLastAction?: string;
    scale: number;
    setScale: (scale: number) => void;
    handleSave: () => Promise<void>;
    saving: boolean;
    saveSuccess: boolean;
    user: {
        uid: string;
        displayName?: string | null;
        photoURL?: string | null;
    } | null;
    logout: () => Promise<void>;
    handleExport: () => void;
}

export default function EditorHeader({
    scrapbook,
    isEditingTitle,
    tempTitle,
    setTempTitle,
    setIsEditingTitle,
    handleTitleUpdate,
    handleUndo,
    handleRedo,
    historyStep,
    historyLength,
    pastStates,
    futureStates,
    currentLastAction,
    scale,
    setScale,
    handleSave,
    saving,
    saveSuccess,
    user,
    logout,
    handleExport
}: EditorHeaderProps) {
    const router = useRouter();
    const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
    const zoomMenuRef = useRef<HTMLDivElement>(null);
    const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);
    const historyMenuRef = useRef<HTMLDivElement>(null);
    const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

    return (
        <div className="pt-4 md:pt-6 px-4 md:px-8 flex justify-center">
            <header className="pointer-events-auto flex items-center gap-2 md:gap-6 bg-white/80 backdrop-blur-md px-3 md:px-6 py-2 md:py-2.5 rounded-2xl border border-black/5 shadow-soft max-w-full md:max-w-fit transition-all hover:bg-white">
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => router.push("/library")}
                        className="size-8 md:size-10 rounded-xl flex items-center justify-center text-ink-light hover:text-sage hover:bg-sage/5 transition-all group/back"
                        title="Retour à la bibliothèque"
                    >
                        <span className="material-symbols-outlined text-[20px] md:text-[24px] group-hover/back:-translate-x-1 transition-transform">arrow_back</span>
                    </button>

                    <div className="h-6 md:h-8 w-px bg-ink/10"></div>

                    <div className="flex flex-col min-w-0 md:min-w-[120px]">
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={handleTitleUpdate}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleUpdate()}
                                className="text-sm md:text-xl font-serif text-ink outline-none border-b border-sage bg-transparent italic w-24 md:w-full"
                            />
                        ) : (
                            <h1
                                onClick={() => {
                                    setTempTitle(scrapbook?.title || "");
                                    setIsEditingTitle(true);
                                }}
                                title="Cliquer pour modifier le titre"
                                className="text-sm md:text-xl font-serif text-ink tracking-tight italic cursor-pointer hover:text-sage transition-colors flex items-center gap-1 md:gap-2 group/title truncate max-w-[80px] sm:max-w-[150px] md:max-w-none"
                            >
                                {scrapbook?.title || "Sans titre"}
                                <span className="material-symbols-outlined text-[14px] md:text-[16px] opacity-0 group-hover/title:opacity-40 hidden sm:block">edit</span>
                            </h1>
                        )}
                        <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-ink-light font-bold mt-0.5 opacity-60 hidden sm:block">Scrappi • v1.0</p>
                    </div>

                    <div className="h-6 md:h-8 w-px bg-ink/10 hidden md:block"></div>

                    <button
                        onClick={async () => {
                            await logout();
                            router.push("/");
                        }}
                        className="text-[10px] uppercase tracking-widest text-ink-light font-bold hover:text-ink transition-colors px-2 hidden lg:block"
                    >
                        Déconnexion
                    </button>

                    <div className="h-6 md:h-8 w-px bg-ink/10"></div>

                    <div className="relative flex items-center" ref={historyMenuRef}>
                        <div className="flex bg-black/5 rounded-xl">
                            <button onClick={handleUndo} disabled={historyStep === 0} className="size-8 md:size-9 rounded-l-xl flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/10 transition-colors disabled:opacity-30" title="Annuler (Ctrl+Z)">
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">undo</span>
                            </button>
                            <button onClick={handleRedo} disabled={historyStep === historyLength - 1} className="size-8 md:size-9 border-r border-l border-ink/10 flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/10 transition-colors disabled:opacity-30" title="Rétablir (Ctrl+Y)">
                                <span className="material-symbols-outlined text-[18px] md:text-[20px]">redo</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsHistoryMenuOpen(!isHistoryMenuOpen);
                                    if (!isHistoryMenuOpen) setIsZoomMenuOpen(false);
                                }}
                                disabled={historyLength <= 1}
                                className="w-6 md:w-8 rounded-r-xl flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/10 transition-colors disabled:opacity-30"
                                title="Historique"
                            >
                                <span className="material-symbols-outlined text-[14px] md:text-[16px]">history</span>
                            </button>
                        </div>

                        {isHistoryMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white/90 backdrop-blur-md rounded-2xl border border-black/5 shadow-xl py-2 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                                {Array.from({ length: historyLength }).map((_, i) => {
                                    // Reverse the index so the most recent is at the top
                                    const actualIndex = historyLength - 1 - i;
                                    const isCurrent = historyStep === actualIndex;
                                    const diff = actualIndex - historyStep;

                                    let actionName = "État initial";
                                    if (actualIndex > 0) {
                                        if (actualIndex < historyStep) {
                                            actionName = pastStates[actualIndex]?.lastAction || `Action ${actualIndex}`;
                                        } else if (actualIndex === historyStep) {
                                            actionName = currentLastAction || `Action ${actualIndex}`;
                                        } else {
                                            actionName = futureStates[actualIndex - historyStep - 1]?.lastAction || `Action ${actualIndex}`;
                                        }
                                    }

                                    let label = isCurrent ? `${actionName} (Actuel)` : actionName;

                                    return (
                                        <button
                                            key={actualIndex}
                                            onClick={() => {
                                                if (diff < 0) {
                                                    for (let j = 0; j < Math.abs(diff); j++) handleUndo();
                                                } else if (diff > 0) {
                                                    for (let j = 0; j < diff; j++) handleRedo();
                                                }
                                                setIsHistoryMenuOpen(false);
                                            }}
                                            className={`w-full px-4 py-2 text-left text-sm hover:bg-sage hover:text-white transition-colors flex items-center gap-2 ${isCurrent ? 'text-sage font-bold bg-sage/5' : 'text-ink-light'}`}
                                        >
                                            <div className={`shrink-0 w-2 h-2 rounded-full ${isCurrent ? 'bg-sage' : 'bg-transparent'}`}></div>
                                            <span className="truncate">{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="h-6 md:h-8 w-px bg-ink/10 hidden sm:block"></div>

                    <div className="relative hidden sm:block" ref={zoomMenuRef}>
                        <button
                            onClick={() => {
                                setIsZoomMenuOpen(!isZoomMenuOpen);
                                if (!isZoomMenuOpen) setIsHistoryMenuOpen(false);
                            }}
                            className="px-2 md:px-3 py-1 md:py-1.5 rounded-xl text-ink-light text-[10px] md:text-xs font-bold flex items-center gap-1 md:gap-1.5 hover:bg-black/5 transition-all shadow-sm"
                            title="Niveau de zoom"
                        >
                            {Math.round(scale * 100)}%
                            <span className="material-symbols-outlined text-[14px] md:text-[16px]">expand_more</span>
                        </button>

                        {isZoomMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-32 bg-white/90 backdrop-blur-md rounded-2xl border border-black/5 shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[100]">
                                {zoomLevels.map(lvl => (
                                    <button
                                        key={lvl}
                                        onClick={() => {
                                            setScale(lvl);
                                            setIsZoomMenuOpen(false);
                                        }}
                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-sage hover:text-white transition-colors ${scale === lvl ? 'text-sage font-bold' : 'text-ink-light'}`}
                                    >
                                        {lvl * 100}%
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-6 md:h-8 w-px bg-ink/10 mx-1"></div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={handleExport}
                        className="px-2 md:px-4 py-1.5 md:py-2 rounded-full text-ink hover:text-ink bg-black/5 hover:bg-black/10 transition-all text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2"
                        title="Exporter en image haute définition"
                    >
                        <span className="material-symbols-outlined text-[14px] md:text-[16px]">download</span>
                        <span className="hidden xs:inline">Exporter</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-3 md:px-5 py-1.5 md:py-2 rounded-full text-white transition-all shadow-md text-[10px] md:text-xs font-bold flex items-center gap-1.5 md:gap-2 disabled:opacity-50 ${saveSuccess ? 'bg-green-500 shadow-green-500/20' : 'bg-sage hover:bg-sage/90 shadow-sage/20'}`}
                        title="Enregistrer les modifications"
                    >
                        <span className="material-symbols-outlined text-[14px] md:text-[16px]">{saveSuccess ? 'check' : 'save'}</span>
                        <span className="hidden xs:inline">{saving ? "..." : saveSuccess ? "Ok" : "Sauver"}</span>
                    </button>

                    <button
                        onClick={() => router.push("/profile")}
                        className="size-8 md:size-9 rounded-full bg-white backdrop-blur-md p-0.5 border border-black/5 shadow-soft shrink-0 overflow-hidden hover:ring-2 hover:ring-sage transition-all active:scale-95"
                        title="Voir mon profil"
                    >
                        {user?.photoURL ? (
                            <Image
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                                width={36}
                                height={36}
                                className="w-full h-full rounded-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-[10px] md:text-xs">
                                {user?.displayName?.charAt(0) || "U"}
                            </div>
                        )}
                    </button>
                </div>
            </header>
        </div>
    );
}
