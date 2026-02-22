"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CanvasElement, Scrapbook } from "@/domain/entities";
import { getScrapbook, getElements, saveElements, updateScrapbook } from "@/infra/db/firestoreService";
import { uploadImage } from "@/infra/db/storageService";
import { useAuth } from "@/infra/auth/authContext";

import EditorHeader from "./components/EditorHeader";
import Toolbar from "./components/Toolbar";
import ToolHUD from "./components/ToolHUD";

// Dynamic import for Konva canvas to avoid SSR issues
const Canvas = dynamic(() => import("./components/CanvasStage"), { ssr: false });

export default function CanvasEditorLayout({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const [history, setHistory] = useState<CanvasElement[][]>([[]]);
    const [historyStep, setHistoryStep] = useState(0);
    const elements = history[historyStep] || [];

    const setElements = (action: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
        const currentState = history[historyStep] || [];
        const nextState = typeof action === 'function' ? action(currentState) : action;

        if (JSON.stringify(currentState) === JSON.stringify(nextState)) return;

        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(nextState);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
    };

    // Auth protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

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

    const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'arrow' | 'eraser' | 'hand'>('select');
    const [activeColor, setActiveColor] = useState('#1a1e26');
    const [activeStrokeWidth, setActiveStrokeWidth] = useState(4);
    const [activeFontFamily, setActiveFontFamily] = useState('Inter');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const helpRef = useRef<HTMLDivElement>(null);

    // Sync active params with selection
    useEffect(() => {
        if (selectedIds.length === 1) {
            const el = elements.find(e => e.id === selectedIds[0]);
            if (el) {
                if (el.type === 'text') {
                    if (el.backgroundColor) {
                        setActiveColor(el.backgroundColor);
                    } else if (el.strokeColor) {
                        setActiveColor(el.strokeColor);
                    }
                } else if ((el.type === 'line' || el.type === 'arrow' || el.type === 'eraser') && el.strokeColor) {
                    if (el.type !== 'eraser') setActiveColor(el.strokeColor);
                    if (el.strokeWidth) setActiveStrokeWidth(el.type === 'eraser' ? Math.round(el.strokeWidth / 3) : el.strokeWidth);
                }
            }
        }
    }, [selectedIds, elements]);

    const elementsRef = useRef(elements);
    const selectedIdsRef = useRef(selectedIds);
    const isEditingTitleRef = useRef(isEditingTitle);

    useEffect(() => {
        elementsRef.current = elements;
        selectedIdsRef.current = selectedIds;
        isEditingTitleRef.current = isEditingTitle;
    }, [elements, selectedIds, isEditingTitle]);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const handleClickOutsideHelp = (event: MouseEvent) => {
            if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
                setIsHelpOpen(false);
            }
        };

        if (isHelpOpen) document.addEventListener("mousedown", handleClickOutsideHelp);
        else document.removeEventListener("mousedown", handleClickOutsideHelp);

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            const isTyping = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA" || activeEl?.getAttribute("contenteditable") === "true";

            if (isTyping || isEditingTitleRef.current) return;

            const isMod = e.metaKey || e.ctrlKey;

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

            if (e.key === "Delete" || e.key === "Backspace") {
                setElements(prev => prev.filter(el => !selectedIdsRef.current.includes(el.id)));
                setSelectedIds([]);
                return;
            }

            const key = e.key.toLowerCase();
            if (key === 'v') setActiveTool('select');
            else if (key === 'h') setActiveTool('hand');
            else if (key === 'b') setActiveTool('draw');
            else if (key === 'a') setActiveTool('arrow');
            else if (key === 'e') setActiveTool('eraser');
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutsideHelp);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isHelpOpen]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (user) {
                await saveElements(projectId, elements, user.uid);
            }
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
            width: 200,
            height: isPostIt ? 200 : 50,
            rotation: 0,
            zIndex: elements.length + 1,
            backgroundColor: isPostIt ? '#eab308' : undefined,
            strokeColor: !isPostIt ? '#1a1e26' : undefined,
        };
        setElements([...elements, newElement]);
        setSelectedIds([id]);
    };

    const handleDelete = () => {
        if (selectedIds.length === 0) return;
        setElements(elements.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
    };

    const handleStrokeWidthChange = (width: number) => {
        setActiveStrokeWidth(width);
        if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                const el = elements.find(e => e.id === id);
                if (el && (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser')) {
                    handleElementChange(id, { strokeWidth: width });
                }
            });
        }
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

    const handleFontChange = (font: string) => {
        setActiveFontFamily(font);
        selectedIds.forEach(id => {
            const el = elements.find(e => e.id === id);
            if (el && el.type === 'text') {
                handleElementChange(id, { fontFamily: font });
            }
        });
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
                <EditorHeader
                    scrapbook={scrapbook}
                    isEditingTitle={isEditingTitle}
                    tempTitle={tempTitle}
                    setTempTitle={setTempTitle}
                    setIsEditingTitle={setIsEditingTitle}
                    handleTitleUpdate={handleTitleUpdate}
                    handleUndo={handleUndo}
                    handleRedo={handleRedo}
                    historyStep={historyStep}
                    historyLength={history.length}
                    scale={scale}
                    setScale={setScale}
                    handleSave={handleSave}
                    saving={saving}
                    saveSuccess={saveSuccess}
                    user={user}
                    logout={logout}
                />

                <div className="flex-1 flex flex-col justify-between pointer-events-none">
                    <div className="flex-1 flex items-start justify-start gap-4 px-8 mt-4">
                        <Toolbar
                            activeTool={activeTool}
                            setActiveTool={setActiveTool}
                            handleDelete={handleDelete}
                            selectedIds={selectedIds}
                            fileInputRef={fileInputRef}
                            uploading={uploading}
                            addTextElement={addTextElement}
                        />

                        <ToolHUD
                            activeTool={activeTool}
                            elements={elements}
                            selectedIds={selectedIds}
                            activeColor={activeColor}
                            activeStrokeWidth={activeStrokeWidth}
                            activeFontFamily={activeFontFamily}
                            handleColorSelect={handleColorSelect}
                            handleStrokeWidthChange={handleStrokeWidthChange}
                            handleFontChange={handleFontChange}
                        />
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
