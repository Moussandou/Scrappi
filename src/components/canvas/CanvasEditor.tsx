"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { CanvasElement, Scrapbook } from "@/domain/entities";
import { getScrapbook, getElements, saveElements, updateScrapbook } from "@/infra/db/firestoreService";
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
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState("");
    const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
    const zoomMenuRef = useRef<HTMLDivElement>(null);

    const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'arrow' | 'eraser' | 'hand'>('select');
    const [activeColor, setActiveColor] = useState('#1a1e26');
    const [activeStrokeWidth, setActiveStrokeWidth] = useState(4);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const helpRef = useRef<HTMLDivElement>(null);

    // Refs for stable event listeners
    const elementsRef = useRef(elements);
    const selectedIdsRef = useRef(selectedIds);
    const isEditingTitleRef = useRef(isEditingTitle);

    useEffect(() => {
        elementsRef.current = elements;
        selectedIdsRef.current = selectedIds;
        isEditingTitleRef.current = isEditingTitle;
    }, [elements, selectedIds, isEditingTitle]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
    const colors = [
        { name: 'Ink', value: '#1a1e26' },
        { name: 'Sage', value: '#8a9a86' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Yellow', value: '#eab308' },
        { name: 'Pink', value: '#ec4899' },
    ];

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
        const handleClickOutsideZoom = (event: MouseEvent) => {
            if (zoomMenuRef.current && !zoomMenuRef.current.contains(event.target as Node)) {
                setIsZoomMenuOpen(false);
            }
        };
        const handleClickOutsideHelp = (event: MouseEvent) => {
            if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
                setIsHelpOpen(false);
            }
        };

        if (isHelpOpen) document.addEventListener("mousedown", handleClickOutsideHelp);
        else document.removeEventListener("mousedown", handleClickOutsideHelp);

        const handleKeyDown = (e: KeyboardEvent) => {
            // Meta check to avoid triggering while typing in inputs
            const activeEl = document.activeElement;
            const isTyping = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || activeEl?.getAttribute("contenteditable") === "true";

            if (isTyping || isEditingTitleRef.current) return;

            const isMod = e.metaKey || e.ctrlKey;

            // Standard Shortcuts
            if (isMod) {
                if (e.key.toLowerCase() === 'a') {
                    e.preventDefault();
                    setSelectedIds(elementsRef.current.map(el => el.id));
                    return;
                }
                if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) handleRedo();
                    else handleUndo();
                    return;
                }
                if (e.key.toLowerCase() === 'y') {
                    e.preventDefault();
                    handleRedo();
                    return;
                }
            }

            // Delete logic
            if (e.key === "Delete" || e.key === "Backspace") {
                // Directly filter here using refs for maximum stability
                setElements(prev => prev.filter(el => !selectedIdsRef.current.includes(el.id)));
                setSelectedIds([]);
                return;
            }

            // Tool switching shortcuts
            const key = e.key.toLowerCase();
            if (key === 'v') setActiveTool('select');
            else if (key === 'h') setActiveTool('hand');
            else if (key === 'b') setActiveTool('draw');
            else if (key === 'a') setActiveTool('arrow');
            else if (key === 'e') setActiveTool('eraser');
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideZoom);
            document.removeEventListener("mousedown", handleClickOutsideHelp);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isZoomMenuOpen, isHelpOpen]);

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

    const handleTitleUpdate = async () => {
        if (!tempTitle.trim() || tempTitle === scrapbook?.title) {
            setIsEditingTitle(false);
            return;
        }

        try {
            await updateScrapbook(projectId, { title: tempTitle });
            setScrapbook(prev => prev ? { ...prev, title: tempTitle } : null);
        } catch (error) {
            console.error("Failed to update title", error);
        } finally {
            setIsEditingTitle(false);
        }
    };

    const handleElementChange = (id: string, partial: Partial<CanvasElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...partial } : el));
    };

    const handleRecenter = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleAddElement = (newElement: CanvasElement) => {
        setElements(prev => [...prev, newElement]);
    };

    const addTextElement = (isPostIt: boolean = false) => {
        const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
        const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;
        const id = crypto.randomUUID();
        const newElement: CanvasElement = {
            id,
            type: "text",
            content: isPostIt ? "Nouvelle note" : "Double click to edit",
            x: (x - position.x) / scale,
            y: (y - position.y) / scale,
            width: isPostIt ? 200 : 200,
            height: isPostIt ? 200 : 50,
            rotation: 0,
            zIndex: elements.length + 1,
            backgroundColor: isPostIt ? activeColor : undefined,
            strokeColor: !isPostIt ? activeColor : undefined,
        };
        setElements([...elements, newElement]);
        setSelectedIds([id]);
    };

    const handleDelete = () => {
        if (selectedIds.length === 0) return;
        setElements(elements.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
    };

    const handleColorSelect = (colorValue: string) => {
        setActiveColor(colorValue);

        if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                const el = elements.find(e => e.id === id);
                if (el) {
                    if (el.type === 'text' && el.backgroundColor) {
                        handleElementChange(id, { backgroundColor: colorValue });
                    } else {
                        handleElementChange(id, { strokeColor: colorValue });
                    }
                }
            });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, `projects/${projectId}`);
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

            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "image",
                content: url,
                x: (x - position.x) / scale,
                y: (y - position.y) / scale,
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

            const x = (e.clientX - position.x) / scale;
            const y = (e.clientY - position.y) / scale;

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

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-paper">
            <div className="text-secondary animate-pulse font-serif text-xl italic">Chargement de votre atelier...</div>
        </div>
    );

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
                    position={position}
                    setPosition={setPosition}
                    activeTool={activeTool}
                    activeColor={activeColor}
                    activeStrokeWidth={activeStrokeWidth}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
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
                <div className="pt-6 px-8 flex justify-center">
                    <header className="pointer-events-auto flex items-center gap-6 bg-white/80 backdrop-blur-md px-6 py-2.5 rounded-2xl border border-black/5 shadow-soft max-w-fit transition-all hover:bg-white">
                        <div className="flex items-center gap-4">
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
                                <p className="text-[10px] uppercase tracking-widest text-ink-light font-bold mt-0.5 opacity-60">Atelier • v1.0</p>
                            </div>

                            <div className="h-8 w-px bg-ink/10"></div>

                            <div className="flex items-center gap-1">
                                <button onClick={handleUndo} disabled={historyStep === 0} className="size-9 rounded-xl flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/5 transition-colors disabled:opacity-30">
                                    <span className="material-symbols-outlined text-[20px]">undo</span>
                                </button>
                                <button onClick={handleRedo} disabled={historyStep === history.length - 1} className="size-9 rounded-xl flex items-center justify-center text-ink-light hover:text-ink hover:bg-black/5 transition-colors disabled:opacity-30">
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
                            <div className="size-9 rounded-full bg-white backdrop-blur-md p-0.5 border border-black/5 shadow-soft shrink-0">
                                <div className="w-full h-full rounded-full bg-cover bg-center ring-2 ring-transparent hover:ring-sage transition-all cursor-pointer" style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')" }}></div>
                            </div>
                        </div>
                    </header>
                </div>

                <div className="flex-1 flex flex-col justify-between pointer-events-none">
                    <div className="flex-1 flex justify-between px-8">
                        <div className="pointer-events-auto flex flex-col gap-4 mt-4">
                            <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2.5 rounded-2xl border border-black/5 shadow-soft">
                                <button
                                    onClick={() => setActiveTool('hand')}
                                    className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'hand' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                                    <span className="material-symbols-outlined">back_hand</span>
                                </button>
                                <button
                                    onClick={() => setActiveTool('select')}
                                    className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'select' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                                    <span className="material-symbols-outlined">near_me</span>
                                </button>
                                <button
                                    onClick={() => setActiveTool('draw')}
                                    className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'draw' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                                    <span className="material-symbols-outlined">brush</span>
                                </button>
                                <button
                                    onClick={() => setActiveTool('arrow')}
                                    className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'arrow' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                                    <span className="material-symbols-outlined">east</span>
                                </button>
                                <button
                                    onClick={() => setActiveTool('eraser')}
                                    className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'eraser' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}>
                                    <span className="material-symbols-outlined">ink_eraser</span>
                                </button>
                                <div className="h-px w-6 bg-ink/10 self-center my-1"></div>
                                <button
                                    onClick={handleDelete}
                                    disabled={selectedIds.length === 0}
                                    className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${selectedIds.length > 0 ? 'text-red-500 hover:bg-red-50' : 'text-ink-light opacity-30 cursor-not-allowed'}`}>
                                    <span className="material-symbols-outlined">delete</span>
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

                        {/* Tool Parameters HUD */}
                        {(activeTool === 'draw' || activeTool === 'arrow' || activeTool === 'eraser') && (
                            <div className="flex flex-col gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-black/5 shadow-xl animate-in fade-in slide-in-from-left-4 duration-200 pointer-events-auto w-32">
                                {activeTool !== 'eraser' && (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider mb-1">Couleur</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {colors.map(color => (
                                                    <button
                                                        key={color.name}
                                                        onClick={() => handleColorSelect(color.value)}
                                                        className={`size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 ${activeColor === color.value ? 'border-ink scale-110 shadow-md' : 'border-transparent'}`}
                                                        style={{ backgroundColor: color.value }}
                                                        title={color.name}
                                                    />
                                                ))}
                                                <div
                                                    className={`relative size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 overflow-hidden flex items-center justify-center ${!colors.some(c => c.value === activeColor) ? 'border-ink scale-110 shadow-md' : 'border-transparent'}`}
                                                    style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                                                    title="Couleur personnalisée"
                                                >
                                                    <input
                                                        type="color"
                                                        value={activeColor}
                                                        onChange={(e) => setActiveColor(e.target.value)}
                                                        className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-px w-full bg-ink/5 my-1" />
                                    </>
                                )}

                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider mb-1">
                                        {activeTool === 'eraser' ? 'Taille gomme' : 'Épaisseur'}
                                    </p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {[2, 4, 8, 16].map((w) => (
                                            <button
                                                key={w}
                                                onClick={() => setActiveStrokeWidth(w)}
                                                className={`h-7 rounded-lg flex items-center justify-center transition-all ${activeStrokeWidth === w ? 'bg-sage text-white shadow-sm' : 'text-ink-light hover:bg-black/5'}`}
                                            >
                                                <div
                                                    className="rounded-full bg-current"
                                                    style={{
                                                        width: Math.max(2, w / 2),
                                                        height: Math.max(2, w / 2)
                                                    }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pointer-events-auto p-8 flex justify-end items-center gap-3">
                        <div className="relative" ref={helpRef}>
                            <button
                                onClick={() => setIsHelpOpen(!isHelpOpen)}
                                className={`size-12 rounded-full bg-white/60 backdrop-blur-md border border-black/5 shadow-soft flex items-center justify-center text-ink-light hover:text-ink transition-all hover:scale-110 active:scale-95 ${isHelpOpen ? 'bg-white shadow-md' : ''}`}
                                title="Raccourcis clavier"
                            >
                                <span className="material-symbols-outlined text-[24px]">help_outline</span>
                            </button>

                            {isHelpOpen && (
                                <div className="absolute bottom-14 right-0 w-64 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-black/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 z-50">
                                    <h4 className="text-xs font-bold text-ink mb-3 uppercase tracking-wider flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">keyboard</span>
                                        Raccourcis
                                    </h4>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'V', label: 'Sélection' },
                                            { key: 'H', label: 'Main (Pan)' },
                                            { key: 'B', label: 'Pinceau' },
                                            { key: 'A', label: 'Flèche' },
                                            { key: 'E', label: 'Gomme' },
                                            { key: '⌘A', label: 'Tout choisir' },
                                            { key: '⌘Z', label: 'Annuler' },
                                            { key: '⌘Y', label: 'Refaire' },
                                            { key: '⌫', label: 'Supprimer' },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between text-[10px]">
                                                <span className="text-ink-light">{item.label}</span>
                                                <kbd className="px-1.5 py-0.5 bg-black/5 rounded font-mono font-bold border border-black/5">{item.key}</kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleRecenter}
                            className="size-12 rounded-full bg-white/80 backdrop-blur-md border border-black/5 shadow-soft flex items-center justify-center text-ink-light hover:text-ink hover:bg-white transition-all hover:scale-110 active:scale-95"
                            title="Recadrer au centre"
                        >
                            <span className="material-symbols-outlined">center_focus_strong</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
