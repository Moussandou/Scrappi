"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { CanvasElement, Scrapbook } from "@/domain/entities";
import { getScrapbook, getElements, saveElements } from "@/infra/db/firestoreService";

const Canvas = dynamic(() => import("./InfiniteCanvas"), {
    ssr: false,
});

export default function CanvasEditor({ projectId }: { projectId: string }) {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const fetchedScrapbook = await getScrapbook(projectId);
                setScrapbook(fetchedScrapbook);

                const fetchedElements = await getElements(projectId);
                setElements(fetchedElements);
            } catch (error) {
                console.error("Failed to load project data", error);
            } finally {
                setLoading(false);
            }
        }
        if (projectId) {
            loadData();
        }
    }, [projectId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveElements(projectId, elements);
        } catch (error) {
            console.error("Failed to save elements", error);
        } finally {
            setSaving(false);
        }
    };

    const addTextElement = () => {
        const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
        const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;
        const newElement: CanvasElement = {
            id: crypto.randomUUID(),
            type: "text",
            content: "Double click to edit",
            x,
            y,
            width: 200,
            height: 50,
            rotation: 0,
            zIndex: elements.length + 1,
        };
        setElements([...elements, newElement]);
    };

    const handleElementChange = (id: string, partial: any) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...partial } : el));
    };

    return (
        <>
            <div className="absolute inset-0 z-0 bg-transparent">
                <Canvas elements={elements} onElementChange={handleElementChange} />
            </div>
            <div className="relative z-50 flex flex-col h-screen pointer-events-none">
                <header className="pointer-events-auto w-full px-6 py-4 flex justify-between items-start">
                    <div className="flex items-center gap-4 bg-surface-glass frosted p-2 pr-6 rounded-full border border-white/5 shadow-glass">
                        <div className="size-10 bg-accent-teal/20 rounded-full flex items-center justify-center text-accent-glow shadow-[0_0_15px_rgba(78,140,156,0.3)] border border-accent-teal/30">
                            <span className="material-symbols-outlined text-[24px]">dark_mode</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-text-cream">
                                {loading ? "Chargement..." : scrapbook?.title || "Scrapbook Introuvable"}
                            </h1>
                            <p className="text-[10px] text-accent-glow font-medium uppercase tracking-wider">Canvas Mode</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-glass frosted p-2 rounded-full border border-white/5 shadow-glass">
                        <button className="size-10 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all tooltip-trigger">
                            <span className="material-symbols-outlined">undo</span>
                        </button>
                        <button className="size-10 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all">
                            <span className="material-symbols-outlined">redo</span>
                        </button>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <div className="flex items-center gap-1 px-3 py-1 bg-black/20 rounded-full cursor-pointer hover:bg-black/40">
                            <span className="text-xs font-mono text-text-cream">100%</span>
                            <span className="material-symbols-outlined text-[16px] text-text-muted">expand_more</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="pointer-events-auto px-5 py-2.5 rounded-full bg-accent-teal/10 border border-accent-teal/30 text-accent-glow hover:bg-accent-teal hover:text-white transition-all backdrop-blur-sm shadow-glow text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            {saving ? "Enregistrement..." : "Sauvegarder"}
                        </button>
                        <div className="size-12 rounded-full bg-surface-glass frosted p-1 border border-white/5 shadow-glass">
                            <div className="w-full h-full rounded-full bg-cover bg-center ring-2 ring-transparent hover:ring-accent-teal transition-all cursor-pointer" style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')" }}></div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex justify-between px-6 pointer-events-none">
                    <div className="pointer-events-auto flex flex-col gap-4 self-center">
                        <div className="flex flex-col gap-2 bg-surface-glass frosted p-3 rounded-2xl border border-white/5 shadow-glass">
                            <button className="size-10 rounded-xl bg-accent-teal text-white shadow-glow flex items-center justify-center transition-transform hover:scale-105">
                                <span className="material-symbols-outlined">arrow_selector_tool</span>
                            </button>
                            <button className="size-10 rounded-xl text-text-muted hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined">brush</span>
                            </button>
                            <button className="size-10 rounded-xl text-text-muted hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined">image</span>
                            </button>
                            <button className="size-10 rounded-xl text-text-muted hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined">sticky_note_2</span>
                            </button>
                            <button onClick={addTextElement} className="size-10 rounded-xl text-text-muted hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors tooltip-trigger pointer-events-auto">
                                <span className="material-symbols-outlined">title</span>
                            </button>
                            <div className="h-px w-6 bg-white/10 mx-auto my-1"></div>
                            <button className="size-10 rounded-xl text-neon-pink hover:text-neon-pink hover:bg-neon-pink/10 flex items-center justify-center transition-colors shadow-[0_0_10px_rgba(255,110,199,0.2)]">
                                <span className="material-symbols-outlined">favorite</span>
                            </button>
                        </div>
                    </div>
                </div>

                <footer className="pointer-events-auto px-6 py-4 flex justify-between items-end">
                    <div className="bg-surface-glass frosted px-4 py-2 rounded-full border border-white/5 shadow-glass flex items-center gap-4">
                        <span className="text-xs text-text-muted">Last edited just now</span>
                    </div>
                    <div className="bg-surface-glass frosted p-2 rounded-full border border-white/5 shadow-glass flex items-center gap-2">
                        <button className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-white flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[18px]">help</span>
                        </button>
                        <button className="size-8 rounded-full bg-white/5 hover:bg-white/10 text-text-muted hover:text-white flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[18px]">settings</span>
                        </button>
                    </div>
                </footer>
            </div>
        </>
    );
}
