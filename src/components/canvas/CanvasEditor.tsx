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
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, `projects/${projectId}`);
            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "image",
                content: url,
                x,
                y,
                width: 300,
                height: 300,
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
            // Basic coordinate mapping (doesn't account for pan/zoom yet, but good for MVP)
            const x = e.clientX;
            const y = e.clientY;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "image",
                content: url,
                x,
                y,
                width: 300,
                height: 300,
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
                <Canvas elements={elements} onElementChange={handleElementChange} />
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
                        <button className="size-10 rounded-full flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/5 transition-all">
                            <span className="material-symbols-outlined">undo</span>
                        </button>
                        <button className="size-10 rounded-full flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/5 transition-all">
                            <span className="material-symbols-outlined">redo</span>
                        </button>
                        <div className="w-px h-6 bg-black/10 mx-1"></div>
                        <div className="flex items-center gap-1 px-4 py-1.5 bg-black/5 rounded-full cursor-pointer hover:bg-black/10 transition-colors">
                            <span className="text-xs font-bold text-ink">100%</span>
                            <span className="material-symbols-outlined text-[16px] text-ink-light">expand_more</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="pointer-events-auto px-6 py-3 rounded-full bg-sage text-white hover:bg-sage/90 transition-all shadow-md shadow-sage/20 text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            {saving ? "Sauvegarde..." : "Enregistrer"}
                        </button>
                        <div className="size-12 rounded-full bg-white/80 backdrop-blur-md p-1 border border-black/5 shadow-soft">
                            <div className="w-full h-full rounded-full bg-cover bg-center ring-2 ring-transparent hover:ring-sage transition-all cursor-pointer" style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')" }}></div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex justify-between px-8 pointer-events-none">
                    <div className="pointer-events-auto flex flex-col gap-4 self-center">
                        <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2.5 rounded-2xl border border-black/5 shadow-soft">
                            <button className="size-11 rounded-xl bg-sage text-white shadow-sm flex items-center justify-center transition-transform hover:scale-105">
                                <span className="material-symbols-outlined">arrow_selector_tool</span>
                            </button>
                            <button className="size-11 rounded-xl text-ink-light hover:text-ink hover:bg-black/5 flex items-center justify-center transition-colors">
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
                            <button className="size-11 rounded-xl text-ink-light hover:text-ink hover:bg-black/5 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined">sticky_note_2</span>
                            </button>
                            <button onClick={addTextElement} className="size-11 rounded-xl text-ink-light hover:text-ink hover:bg-black/5 flex items-center justify-center transition-colors pointer-events-auto">
                                <span className="material-symbols-outlined">title</span>
                            </button>
                            <div className="h-px w-6 bg-black/5 mx-auto my-1"></div>
                            <button className="size-11 rounded-xl text-pink-500 hover:bg-pink-50 flex items-center justify-center transition-colors">
                                <span className="material-symbols-outlined border-pink-500">favorite</span>
                            </button>
                        </div>
                    </div>
                </div>

                <footer className="pointer-events-auto px-8 py-6 flex justify-between items-end">
                    <div className="bg-white/80 backdrop-blur-md px-5 py-3 rounded-full border border-black/5 shadow-soft flex items-center gap-5">
                        <span className="text-xs text-ink-light font-medium">Brouillon en cours</span>
                    </div>
                    <div className="bg-white/80 backdrop-blur-md p-2.5 rounded-full border border-black/5 shadow-soft flex items-center gap-2">
                        <button className="size-9 rounded-full bg-black/5 hover:bg-black/10 text-ink-light hover:text-ink flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[20px]">help</span>
                        </button>
                        <button className="size-9 rounded-full bg-black/5 hover:bg-black/10 text-ink-light hover:text-ink flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}

