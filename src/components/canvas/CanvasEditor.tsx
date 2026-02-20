"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { CanvasElement, Scrapbook } from "@/domain/entities";
import { getScrapbook, getElements, saveElements } from "@/infra/db/firestoreService";
import { uploadImage } from "@/infra/db/storageService";

const Canvas = dynamic(() => import("./InfiniteCanvas"), {
    ssr: false,
});

export default function CanvasEditor({ projectId }: { projectId: string }) {
    const [history, setHistory] = useState<CanvasElement[][]>([[]]);
    const [historyStep, setHistoryStep] = useState(0);
    const elements = history[historyStep] || [];

    const setElements = (action: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
        const currentState = history[historyStep] || [];
        const nextState = typeof action === 'function' ? action(currentState) : action;

        // Don't push to history if nothing changed
        if (JSON.stringify(currentState) === JSON.stringify(nextState)) return;

        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(nextState);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
        }
    };

    const handleRedo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
        }
    };
    const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [scale, setScale] = useState(1);
    const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
    const zoomMenuRef = useRef<HTMLDivElement>(null);
    const [activeTool, setActiveTool] = useState<'select' | 'draw'>('select');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const fetchedScrapbook = await getScrapbook(projectId);
                setScrapbook(fetchedScrapbook);

                const fetchedElements = await getElements(projectId);
                setHistory([fetchedElements]);
                setHistoryStep(0);
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (zoomMenuRef.current && !zoomMenuRef.current.contains(event.target as Node)) {
                setIsZoomMenuOpen(false);
            }
        };

        if (isZoomMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isZoomMenuOpen]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveElements(projectId, elements);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error("Failed to save elements", error);
        } finally {
            setSaving(false);
        }
    };
    const addTextElement = (isPostIt: boolean = false) => {
        const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
        const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;
        const newElement: CanvasElement = {
            id: crypto.randomUUID(),
            type: "text",
            content: isPostIt ? "Nouvelle note" : "Double click to edit",
            x,
            y,
            width: isPostIt ? 200 : 200,
            height: isPostIt ? 200 : 50,
            rotation: 0,
            zIndex: elements.length + 1,
            backgroundColor: isPostIt ? "#fef08a" : undefined, // Tailwind yellow-200
        };
        setElements([...elements, newElement]);
    };
    const handleElementChange = (id: string, partial: Partial<CanvasElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...partial } : el));
    };

    const handleAddElement = (newElement: CanvasElement) => {
        setElements(prev => [...prev, newElement]);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, `projects/${projectId}`);

            // Get original image dimensions
            const img = new window.Image();
            img.src = url;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            let finalWidth = img.width;
            let finalHeight = img.height;
            const maxSize = 400; // reasonable max size

            if (finalWidth > maxSize || finalHeight > maxSize) {
                const ratio = Math.min(maxSize / finalWidth, maxSize / finalHeight);
                finalWidth *= ratio;
                finalHeight *= ratio;
            }

            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "image",
                content: url,
                x,
                y,
                width: finalWidth,
                height: finalHeight,
                rotation: 0,
                zIndex: elements.length + 1,
            };
            setElements(prev => [...prev, newElement]);
        } catch (error) {
            console.error("Failed to upload image", error);
            alert("Erreur lors de l'upload de l'image.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, `projects/${projectId}`);

            // Get original image dimensions
            const img = new window.Image();
            img.src = url;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            let finalWidth = img.width;
            let finalHeight = img.height;
            const maxSize = 400;

            if (finalWidth > maxSize || finalHeight > maxSize) {
                const ratio = Math.min(maxSize / finalWidth, maxSize / finalHeight);
                finalWidth *= ratio;
                finalHeight *= ratio;
            }

            // Basic coordinate mapping (doesn't account for pan/zoom yet, but good for MVP)
            const x = e.clientX;
            const y = e.clientY;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "image",
                content: url,
                x,
                y,
                width: finalWidth,
                height: finalHeight,
                rotation: 0,
                zIndex: elements.length + 1,
            };
            setElements(prev => [...prev, newElement]);
        } catch (error) {
            console.error("Failed to upload image from drop", error);
            alert("Erreur lors de l'upload de l'image.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="bg-paper min-h-screen relative overflow-hidden font-sans">
            <div className="fixed inset-0 pointer-events-none opacity-40 z-0 mix-blend-multiply sketchbook-grid"></div>

            <div
                className="absolute inset-0 z-0 bg-transparent"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <Canvas
                    elements={elements}
                    onElementChange={handleElementChange}
                    onAddElement={handleAddElement}
                    scale={scale}
                    setScale={setScale}
                    activeTool={activeTool}
                />
            </div>

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
            />

            <div className="relative z-50 flex flex-col h-screen pointer-events-none">
                <header className="pointer-events-auto w-full px-8 py-6 flex justify-between items-start">
                    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-2 pr-8 rounded-full border border-black/5 shadow-soft">
                        <div className="size-11 bg-sage/10 rounded-full flex items-center justify-center text-sage border border-sage/20">
                            <span className="material-symbols-outlined text-[26px]">brush</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold tracking-tight text-ink">
                                {loading ? "Chargement..." : scrapbook?.title || "Scrapbook Introuvable"}
                            </h1>
                            <p className="text-[10px] text-sage font-bold uppercase tracking-wider">Mode Créatif</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 rounded-full border border-black/5 shadow-soft">
                        <button
                            onClick={handleUndo}
                            disabled={historyStep === 0}
                            className={`size-10 rounded-full flex items-center justify-center transition-all ${historyStep === 0 ? 'text-ink-light/30 cursor-not-allowed' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                            <span className="material-symbols-outlined">undo</span>
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={historyStep === history.length - 1}
                            className={`size-10 rounded-full flex items-center justify-center transition-all ${historyStep === history.length - 1 ? 'text-ink-light/30 cursor-not-allowed' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                            <span className="material-symbols-outlined">redo</span>
                        </button>
                        <div className="w-px h-6 bg-black/10 mx-1"></div>
                        <div className="relative">
                            <button
                                onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
                                className={`flex items-center gap-1 px-4 py-1.5 rounded-full transition-colors pointer-events-auto ${isZoomMenuOpen ? 'bg-black/10' : 'bg-black/5 hover:bg-black/10'}`}
                            >
                                <span className="text-xs font-bold text-ink">{Math.round(scale * 100)}%</span>
                                <span className="material-symbols-outlined text-[16px] text-ink-light">expand_more</span>
                            </button>
                            {isZoomMenuOpen && (
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-black/5 py-2 w-32 pointer-events-auto">
                                    {zoomLevels.map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => {
                                                setScale(level);
                                                setIsZoomMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-black/5 flex items-center justify-between"
                                        >
                                            {Math.round(level * 100)}%
                                            {scale === level && <span className="material-symbols-outlined text-[16px] text-sage">check</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`pointer-events-auto px-6 py-3 rounded-full text-white transition-all shadow-md text-sm font-bold flex items-center gap-2 disabled:opacity-50 ${saveSuccess ? 'bg-green-500 shadow-green-500/20' : 'bg-sage hover:bg-sage/90 shadow-sage/20'}`}>
                            <span className="material-symbols-outlined text-[18px]">{saveSuccess ? 'check' : 'save'}</span>
                            {saving ? "Sauvegarde..." : saveSuccess ? "Enregistré !" : "Enregistrer"}
                        </button>
                        <div className="size-12 rounded-full bg-white/80 backdrop-blur-md p-1 border border-black/5 shadow-soft">
                            <div className="w-full h-full rounded-full bg-cover bg-center ring-2 ring-transparent hover:ring-sage transition-all cursor-pointer" style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')" }}></div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex justify-between px-8 pointer-events-none">
                    <div className="pointer-events-auto flex flex-col gap-4 self-center">
                        <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2.5 rounded-2xl border border-black/5 shadow-soft">
                            <button
                                onClick={() => setActiveTool('select')}
                                className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'select' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                                <span className="material-symbols-outlined">arrow_selector_tool</span>
                            </button>
                            <button
                                onClick={() => setActiveTool('draw')}
                                className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'draw' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                                <span className="material-symbols-outlined">brush</span>
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="size-11 rounded-xl text-ink-light hover:text-ink hover:bg-black/5 flex items-center justify-center transition-colors pointer-events-auto"
                            >
                                <span className="material-symbols-outlined">
                                    {uploading ? "hourglass_empty" : "image"}
                                </span>
                            </button>
                            <button
                                onClick={() => addTextElement(true)}
                                className="size-11 rounded-xl text-ink-light hover:text-ink hover:bg-black/5 flex items-center justify-center transition-colors pointer-events-auto">
                                <span className="material-symbols-outlined">sticky_note_2</span>
                            </button>
                            <button onClick={() => addTextElement(false)} className="size-11 rounded-xl text-ink-light hover:text-ink hover:bg-black/5 flex items-center justify-center transition-colors pointer-events-auto">
                                <span className="material-symbols-outlined">title</span>
                            </button>
                        </div>
                    </div>
                </div>

                <footer className="pointer-events-auto px-8 py-6 flex justify-between items-end">
                    <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-full border border-black/5 shadow-soft flex items-center gap-5">
                        <span className="text-xs text-ink-light font-medium">Brouillon en cours</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}

