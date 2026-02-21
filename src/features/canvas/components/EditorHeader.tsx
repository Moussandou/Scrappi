"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
    scale,
    setScale,
    handleSave,
    saving,
    saveSuccess,
    user,
    logout
}: EditorHeaderProps) {
    const router = useRouter();
    const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
    const zoomMenuRef = useRef<HTMLDivElement>(null);
    const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

    return (
        <div className="pt-6 px-8 flex justify-center">
            <header className="pointer-events-auto flex items-center gap-6 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-black/5 shadow-soft max-w-fit transition-all hover:bg-white">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/library")}
                        className="size-10 rounded-xl flex items-center justify-center text-ink-light hover:text-sage hover:bg-sage/5 transition-all group/back"
                        title="Retour à la bibliothèque"
                    >
                        <span className="material-symbols-outlined text-[24px] group-hover/back:-translate-x-1 transition-transform">arrow_back</span>
                    </button>

                    <div className="h-8 w-px bg-ink/10"></div>

                    <div className="flex flex-col min-w-[120px]">
                        {isEditingTitle ? (
                            <input
                                autoFocus
                                value={tempTitle}
                                onChange={(e) => setTempTitle(e.target.value)}
                                onBlur={handleTitleUpdate}
                                onKeyDown={(e) => e.key === 'Enter' && handleTitleUpdate()}
                                className="text-xl font-serif text-ink outline-none border-b border-sage bg-transparent italic"
                            />
                        ) : (
                            <h1
                                onClick={() => {
                                    setTempTitle(scrapbook?.title || "");
                                    setIsEditingTitle(true);
                                }}
                                className="text-xl font-serif text-ink tracking-tight italic cursor-pointer hover:text-sage transition-colors flex items-center gap-2 group/title"
                            >
                                {scrapbook?.title || "Projet sans titre"}
                                <span className="material-symbols-outlined text-[16px] opacity-0 group-hover/title:opacity-40">edit</span>
                            </h1>
                        )}
                        <p className="text-[10px] uppercase tracking-widest text-ink-light font-bold mt-0.5 opacity-60">Scrappi • v1.0</p>
                    </div>

                    <div className="h-8 w-px bg-ink/10"></div>

                    <button
                        onClick={async () => {
                            await logout();
                            router.push("/");
                        }}
                        className="text-[10px] uppercase tracking-widest text-ink-light font-bold hover:text-ink transition-colors px-2"
                    >
                        Déconnexion
                    </button>

                    <div className="h-8 w-px bg-ink/10"></div>

                    <div className="flex items-center gap-1">
                        <button onClick={handleUndo} disabled={historyStep === 0} className="size-9 rounded-xl flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/5 transition-colors disabled:opacity-30">
                            <span className="material-symbols-outlined text-[20px]">undo</span>
                        </button>
                        <button onClick={handleRedo} disabled={historyStep === historyLength - 1} className="size-9 rounded-xl flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/5 transition-colors disabled:opacity-30">
                            <span className="material-symbols-outlined text-[20px]">redo</span>
                        </button>
                    </div>

                    <div className="h-8 w-px bg-ink/10"></div>

                    <div className="relative" ref={zoomMenuRef}>
                        <button
                            onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
                            className="px-3 py-1.5 rounded-xl text-ink-light text-xs font-bold flex items-center gap-1.5 hover:bg-black/5 transition-all shadow-sm"
                        >
                            {Math.round(scale * 100)}%
                            <span className="material-symbols-outlined text-[16px]">expand_more</span>
                        </button>

                        {isZoomMenuOpen && (
                            <div className="absolute top-full left-0 mt-2 w-32 bg-white/90 backdrop-blur-md rounded-2xl border border-black/5 shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
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

                <div className="h-8 w-px bg-ink/10 mx-1"></div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`px-5 py-2 rounded-full text-white transition-all shadow-md text-xs font-bold flex items-center gap-2 disabled:opacity-50 ${saveSuccess ? 'bg-green-500 shadow-green-500/20' : 'bg-sage hover:bg-sage/90 shadow-sage/20'}`}>
                        <span className="material-symbols-outlined text-[16px]">{saveSuccess ? 'check' : 'save'}</span>
                        {saving ? "..." : saveSuccess ? "Ok" : "Sauver"}
                    </button>
                    <div className="size-9 rounded-full bg-white backdrop-blur-md p-0.5 border border-black/5 shadow-soft shrink-0 overflow-hidden">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                                className="w-full h-full rounded-full object-cover ring-2 ring-transparent hover:ring-sage transition-all cursor-pointer"
                            />
                        ) : (
                            <div className="w-full h-full rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-xs ring-2 ring-transparent hover:ring-sage transition-all cursor-pointer">
                                {user?.displayName?.charAt(0) || "U"}
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </div>
    );
}
