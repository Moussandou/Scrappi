"use client";

import { useState, useEffect, useRef } from "react";
import { useStore } from "zustand";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CanvasElement, Scrapbook } from "@/domain/entities";
import { getScrapbook, getElements, saveElements, saveDirtyElements, updateScrapbook } from "@/infra/db/firestoreService";
import { useStorageMode } from "./hooks/useStorageMode";
import { useAuth } from "@/infra/auth/authContext";

import EditorHeader from "./components/EditorHeader";
import Toolbar from "./components/Toolbar";
import ProjectSidebar from "./components/ProjectSidebar";
import FloatingContextHUD from "./components/FloatingContextHUD";
import StickerTray from "./components/StickerTray";
import ImageUploadModal from "./components/ImageUploadModal";
import VideoUploadModal from "./components/VideoUploadModal";
import MiniMap from "./components/MiniMap";
import { PaperType } from "./components/PaperSelector";

import { useCanvasStore } from "./store/useCanvasStore";
import { useCanvasShortcuts } from "./hooks/useCanvasShortcuts";
import { useMediaManager } from "./hooks/useMediaManager";

import { CanvasStageRef } from "./components/CanvasStage";

// Dynamic import for Konva canvas to avoid SSR issues
const Canvas = dynamic(() => import("./components/CanvasStage"), { ssr: false }) as any;

const EMPTY_ARRAY: any[] = [];
const DEFAULT_POSITION = { x: 0, y: 0 };

const NO_OP = () => { };

export default function CanvasEditorLayout({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const storageMode = useStorageMode();

    // -- Zustand Store --
    // We use selectors for data to ensure reactivity
    const elements = useCanvasStore(state => state?.elements) || EMPTY_ARRAY;
    const selectedIds = useCanvasStore(state => state?.selectedIds) || EMPTY_ARRAY;

    // Actions retrieved individually to avoid "getSnapshot" infinite loop
    const setElements = useCanvasStore(state => state?.setElements) || NO_OP;
    const addElement = useCanvasStore(state => state?.addElement) || NO_OP;
    const updateElement = useCanvasStore(state => state?.updateElement) || NO_OP;
    const removeElements = useCanvasStore(state => state?.removeElements) || NO_OP;
    const groupElements = useCanvasStore(state => state?.groupElements) || NO_OP;
    const ungroupElements = useCanvasStore(state => state?.ungroupElements) || NO_OP;
    const setActiveTool = useCanvasStore(state => state?.setActiveTool) || NO_OP;
    const setActiveColor = useCanvasStore(state => state?.setActiveColor) || NO_OP;
    const setActiveStrokeWidth = useCanvasStore(state => state?.setActiveStrokeWidth) || NO_OP;
    const setSelectedIds = useCanvasStore(state => state?.setSelectedIds) || NO_OP;
    const setScale = useCanvasStore(state => state?.setScale) || NO_OP;
    const setPosition = useCanvasStore(state => state?.setPosition) || NO_OP;
    const resetStore = useCanvasStore(state => state?.resetStore) || NO_OP;
    const setProjectLoading = useCanvasStore(state => state?.setProjectLoading) || NO_OP;

    const currentLastAction = useCanvasStore(state => state?.lastAction);
    const activeTool = useCanvasStore(state => state?.activeTool) || 'select';
    const activeColor = useCanvasStore(state => state?.activeColor) || '#1a1e26';
    const activeStrokeWidth = useCanvasStore(state => state?.activeStrokeWidth) || 2;
    const scale = useCanvasStore(state => state?.scale) ?? 1;
    const position = useCanvasStore(state => state?.position) || DEFAULT_POSITION;

    // -- History tracking --
    const undo = useCanvasStore(state => state?.undo) || NO_OP;
    const redo = useCanvasStore(state => state?.redo) || NO_OP;
    const pastStates = useCanvasStore(state => state?.pastStates) || EMPTY_ARRAY;
    const futureStates = useCanvasStore(state => state?.futureStates) || EMPTY_ARRAY;
    const clearHistory = useCanvasStore(state => state?.clearHistory) || NO_OP;

    useEffect(() => {
        if (pastStates.length > 0) {
            console.log(`History Step ${pastStates.length}/${pastStates.length + futureStates.length + 1} | Last action: ${currentLastAction}`);
        }
    }, [pastStates, futureStates, currentLastAction]);

    // -- Local State --
    const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState("");
    const [activeFontFamily, setActiveFontFamily] = useState('Inter');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [paperType, setPaperType] = useState<PaperType>('watercolor');
    const [paperColor, setPaperColor] = useState<string>('#ffffff'); // Default to white

    const helpRef = useRef<HTMLDivElement>(null);
    const lastSavedElementsRef = useRef<CanvasElement[]>([]);
    const stageRef = useRef<CanvasStageRef>(null);
    const inFlightRef = useRef<string | boolean>(false);

    // -- Custom Hooks --
    useCanvasShortcuts(isHelpOpen, isEditingTitle, helpRef, setIsHelpOpen);

    const media = useMediaManager(projectId, storageMode);

    // Auth protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Sync active params with selection
    useEffect(() => {
        if (selectedIds.length === 1) {
            const el = elements.find(e => e.id === selectedIds[0]);
            if (el) {
                if (el.type === 'text') {
                    if (el.backgroundColor) setActiveColor(el.backgroundColor);
                    else if (el.strokeColor) setActiveColor(el.strokeColor);
                } else if ((el.type === 'line' || el.type === 'arrow' || el.type === 'eraser') && el.strokeColor) {
                    if (el.type !== 'eraser') setActiveColor(el.strokeColor);
                    if (el.strokeWidth) setActiveStrokeWidth(el.type === 'eraser' ? Math.round(el.strokeWidth / 3) : el.strokeWidth);
                }
            }
        }
    }, [selectedIds, elements, setActiveColor, setActiveStrokeWidth]);

    // Data Loading
    useEffect(() => {
        async function loadData() {
            // Use projectId as unique loader key
            if (inFlightRef.current === projectId) return;
            inFlightRef.current = projectId as string | boolean;

            setLoading(true);
            const store = useCanvasStore.getState();
            store.setProjectLoading(true);

            try {
                // Reset store completely and clear history
                store.resetStore();
                store.clearHistory();

                const fetchedScrapbook = await getScrapbook(projectId);
                setScrapbook(fetchedScrapbook);
                if (fetchedScrapbook?.backgroundColor) setPaperColor(fetchedScrapbook.backgroundColor);
                if (fetchedScrapbook?.paperType) setPaperType(fetchedScrapbook.paperType as PaperType);

                const fetchedElements = await getElements(projectId);
                store.setElements(fetchedElements);
                lastSavedElementsRef.current = JSON.parse(JSON.stringify(fetchedElements));

                // Intelligent centering
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                if (fetchedElements.length > 0) {
                    const minX = Math.min(...fetchedElements.map(el => el.x));
                    const minY = Math.min(...fetchedElements.map(el => el.y));
                    const maxX = Math.max(...fetchedElements.map(el => el.x + (el.width || 0)));
                    const maxY = Math.max(...fetchedElements.map(el => el.y + (el.height || 0)));

                    const contentWidth = maxX - minX;
                    const contentHeight = maxY - minY;

                    const padding = 40;
                    const scaleX = (viewportWidth - padding * 2) / contentWidth;
                    const scaleY = (viewportHeight - padding * 2) / contentHeight;
                    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 1.5);

                    store.setScale(newScale);
                    store.setPosition({
                        x: (viewportWidth / 2) - (minX + contentWidth / 2) * newScale,
                        y: (viewportHeight / 2) - (minY + contentHeight / 2) * newScale
                    });
                } else {
                    store.setPosition({ x: viewportWidth / 2, y: viewportHeight / 2 });
                    store.setScale(1);
                }

                store.clearHistory(); // Final explicit clear to ensure no startup states recorded
                store.setProjectLoading(false);

            } catch (error) {
                console.error("Failed to load project data", error);
                inFlightRef.current = false;
            } finally {
                setLoading(false);
            }
        }

        if (projectId) {
            loadData();
        }

        return () => {
            // Optional cleanup
        };
    }, [projectId]); // ONLY depend on projectId

    const handleSave = async () => {
        setSaving(true);
        try {
            if (user) {
                const currentElements = useCanvasStore.getState().elements;
                const addedOrUpdated: CanvasElement[] = [];
                const deletedIds: string[] = [];

                const lastSavedMap = new Map(lastSavedElementsRef.current.map(e => [e.id, e]));

                currentElements.forEach(el => {
                    const old = lastSavedMap.get(el.id);
                    // Compare deeply or strictly (JSON.stringify is acceptable for simple JSON objects)
                    if (!old || JSON.stringify(old) !== JSON.stringify(el)) {
                        addedOrUpdated.push(el);
                    }
                    lastSavedMap.delete(el.id);
                });

                // What's left in the map was deleted
                lastSavedMap.forEach((_, id) => {
                    deletedIds.push(id);
                });

                // Save elements targetively
                if (addedOrUpdated.length > 0 || deletedIds.length > 0) {
                    await saveDirtyElements(projectId, user.uid, addedOrUpdated, deletedIds);
                    lastSavedElementsRef.current = JSON.parse(JSON.stringify(currentElements));
                }

                // Save scrapbook metadata
                await updateScrapbook(projectId, {
                    backgroundColor: paperColor,
                    paperType: paperType
                });
            }
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error("Failed to save", error);
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

    const handleRecenter = () => {
        if (typeof window === "undefined") return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (elements.length > 0) {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            elements.forEach(el => {
                let ex1 = el.x;
                let ey1 = el.y;
                let ex2 = el.x + (el.width || 0);
                let ey2 = el.y + (el.height || 0);

                if (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser') {
                    if (el.points && el.points.length > 0) {
                        const xs = el.points.filter((_, i) => i % 2 === 0);
                        const ys = el.points.filter((_, i) => i % 2 === 1);
                        ex1 = el.x + Math.min(...xs);
                        ey1 = el.y + Math.min(...ys);
                        ex2 = el.x + Math.max(...xs);
                        ey2 = el.y + Math.max(...ys);
                    }
                }

                if (ex1 < minX) minX = ex1;
                if (ey1 < minY) minY = ey1;
                if (ex2 > maxX) maxX = ex2;
                if (ey2 > maxY) maxY = ey2;
            });

            const contentWidth = maxX - minX;
            const contentHeight = maxY - minY;

            // Padding and available viewport space (accounting for UI)
            const padding = 100;
            // Left sidebar is generally ~280px on desktop
            const sidebarOffset = viewportWidth >= 768 ? 280 : 0;
            // Header is generally ~100px down on desktop
            const topOffset = 80;

            const availableWidth = viewportWidth - sidebarOffset - padding * 2;
            const availableHeight = viewportHeight - topOffset - padding * 2;

            const scaleX = availableWidth / contentWidth;
            const scaleY = availableHeight / contentHeight;
            const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 1.5);

            setScale(newScale);
            setPosition({
                x: sidebarOffset + (availableWidth / 2) - (minX + contentWidth / 2) * newScale,
                y: topOffset + (availableHeight / 2) - (minY + contentHeight / 2) * newScale
            });
        } else {
            setScale(1);
            setPosition({ x: viewportWidth / 2, y: viewportHeight / 2 });
        }
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
        addElement(newElement);
        setSelectedIds([id]);
    };

    const handleStrokeWidthChange = (width: number) => {
        setActiveStrokeWidth(width);
        if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                const el = elements.find(e => e.id === id);
                if (el && (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser')) {
                    updateElement(id, { strokeWidth: width });
                }
            });
        }
    };

    const handleColorSelect = (colorValue: string) => {
        setActiveColor(colorValue);
        if (selectedIds.length > 0) {
            selectedIds.forEach(id => {
                const el = elements.find(e => e.id === id);
                if (!el) return;
                if (el.type === 'text' && el.backgroundColor) {
                    updateElement(id, { backgroundColor: colorValue });
                } else if (el.type !== 'image' && el.type !== 'sticker') {
                    updateElement(id, { strokeColor: colorValue });
                }
            });
        }
    };

    const handleFontChange = (font: string) => {
        setActiveFontFamily(font);
        selectedIds.forEach(id => {
            const el = elements.find(e => e.id === id);
            if (el && el.type === 'text') {
                updateElement(id, { fontFamily: font });
            }
        });
    };

    const handleMoveZ = (direction: 'forward' | 'backward' | 'front' | 'back') => {
        if (selectedIds.length === 0) return;

        // Clone and sort elements array so Zustand sees the change
        const next = [...elements];
        const selectedIndices = selectedIds
            .map(id => next.findIndex(el => el.id === id))
            .filter(idx => idx !== -1)
            .sort((a, b) => a - b);

        if (selectedIndices.length === 0) return;

        if (direction === 'front') {
            const selectedElements = selectedIndices.map(idx => next[idx]);
            const remainingElements = next.filter((_, idx) => !selectedIndices.includes(idx));
            setElements([...remainingElements, ...selectedElements]);
        } else if (direction === 'back') {
            const selectedElements = selectedIndices.map(idx => next[idx]);
            const remainingElements = next.filter((_, idx) => !selectedIndices.includes(idx));
            setElements([...selectedElements, ...remainingElements]);
        } else if (direction === 'forward') {
            const maxIdx = Math.max(...selectedIndices);
            if (maxIdx < next.length - 1) {
                const selectedSet = new Set(selectedIds);
                let nextNonSelected = -1;
                for (let i = maxIdx + 1; i < next.length; i++) {
                    if (!selectedSet.has(next[i].id)) {
                        nextNonSelected = i;
                        break;
                    }
                }

                if (nextNonSelected !== -1) {
                    const selectedItems = selectedIndices.map(i => next[i]);
                    const swappedItem = next[nextNonSelected];
                    const filtered = next.filter((_, i) => !selectedIndices.includes(i));
                    const insertIdx = filtered.findIndex(el => el.id === swappedItem.id);
                    filtered.splice(insertIdx + 1, 0, ...selectedItems);
                    setElements(filtered);
                }
            }
        } else if (direction === 'backward') {
            const minIdx = Math.min(...selectedIndices);
            if (minIdx > 0) {
                const selectedSet = new Set(selectedIds);
                let prevNonSelected = -1;
                for (let i = minIdx - 1; i >= 0; i--) {
                    if (!selectedSet.has(next[i].id)) {
                        prevNonSelected = i;
                        break;
                    }
                }

                if (prevNonSelected !== -1) {
                    const selectedItems = selectedIndices.map(i => next[i]);
                    const swappedItem = next[prevNonSelected];
                    const filtered = next.filter((_, i) => !selectedIndices.includes(i));
                    const insertIdx = filtered.findIndex(el => el.id === swappedItem.id);
                    filtered.splice(insertIdx, 0, ...selectedItems);
                    setElements(filtered);
                }
            }
        }
    };

    const handleExport = () => {
        if (stageRef.current) {
            stageRef.current.exportToPNG(scrapbook?.title || 'scrappi_export', paperColor || '#ffffff');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-paper">
            <div className="text-secondary animate-pulse font-serif text-xl italic">Chargement de votre atelier...</div>
        </div>
    );

    const getPaperClass = () => {
        switch (paperType) {
            case 'canson': return 'paper-grain-canson';
            case 'watercolor': return 'paper-grain-watercolor';
            case 'kraft': return 'paper-grain-kraft';
            default: return 'paper-grain-800dpi';
        }
    };

    return (
        <div
            className={`${paperType === 'kraft' ? 'kraft-paper' : 'bg-paper'} min-h-screen relative overflow-hidden font-sans transition-colors duration-500`}
            style={paperColor ? { backgroundColor: paperColor } : {}}
            onDragOver={(e) => e.preventDefault()}
            onDrop={media.handleDrop}
        >
            <div className={`fixed inset-0 pointer-events-none opacity-40 z-0 mix-blend-multiply sketchbook-grid ${paperType === 'kraft' ? 'opacity-20' : ''}`}></div>
            <div className={`fixed inset-0 pointer-events-none z-10 ${getPaperClass()}`}></div>

            <div className="absolute inset-0 z-20">
                <Canvas ref={stageRef} />
            </div>

            <div className="fixed inset-0 z-50 pointer-events-none">
                <EditorHeader
                    scrapbook={scrapbook}
                    isEditingTitle={isEditingTitle}
                    tempTitle={tempTitle}
                    setTempTitle={setTempTitle}
                    setIsEditingTitle={setIsEditingTitle}
                    handleTitleUpdate={handleTitleUpdate}
                    handleSave={handleSave}
                    saving={saving}
                    saveSuccess={saveSuccess}
                    handleUndo={undo}
                    handleRedo={redo}
                    historyStep={pastStates.length}
                    historyLength={pastStates.length + futureStates.length + 1}
                    pastStates={pastStates}
                    futureStates={futureStates}
                    currentLastAction={currentLastAction}
                    scale={scale}
                    setScale={setScale}
                    user={user}
                    logout={logout}
                    handleExport={handleExport}
                />

                <div className="absolute inset-0 pointer-events-none">
                    <div className="flex-1 flex items-start justify-start gap-4 px-8 mt-4">
                        <Toolbar
                            activeTool={activeTool}
                            setActiveTool={setActiveTool}
                            handleDelete={() => removeElements(selectedIds)}
                            selectedIds={selectedIds}
                            addTextElement={addTextElement}
                            toggleStickerTray={() => media.setIsStickerTrayOpen(!media.isStickerTrayOpen)}
                            isStickerTrayOpen={media.isStickerTrayOpen}
                            openImageModal={() => media.setIsImageModalOpen(true)}
                            openVideoModal={() => media.setIsVideoModalOpen(true)}
                        />

                        <StickerTray
                            isOpen={media.isStickerTrayOpen}
                            onClose={() => media.setIsStickerTrayOpen(false)}
                            onSelectSticker={media.handleAddSticker}
                        />

                        <ImageUploadModal
                            isOpen={media.isImageModalOpen}
                            onClose={() => media.setIsImageModalOpen(false)}
                            onUpload={media.handleFileSelection}
                            uploading={media.uploading}
                            storageMode={storageMode.mode}
                        />

                        <VideoUploadModal
                            isOpen={media.isVideoModalOpen}
                            onClose={() => media.setIsVideoModalOpen(false)}
                            onUpload={media.handleVideoSelection}
                            uploading={media.uploading}
                            storageMode={storageMode.mode}
                        />

                        {media.uploading && (
                            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
                                <div className="bg-ink text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[260px]">
                                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">
                                            Import {media.uploadLabel} en cours...
                                        </p>
                                        <div className="mt-1.5 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-sage rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${media.uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-white/60 mt-1">{media.uploadProgress}%</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <ProjectSidebar
                            paperType={paperType}
                            onPaperTypeChange={setPaperType}
                            paperColor={paperColor}
                            onPaperColorChange={setPaperColor}
                            storageMode={storageMode}
                            isStickerTrayOpen={media.isStickerTrayOpen}
                        />

                        {!media.isImageModalOpen && !media.isVideoModalOpen && (
                            <FloatingContextHUD
                                selectedElements={
                                    selectedIds.length > 0
                                        ? elements.filter(el => selectedIds.includes(el.id))
                                        : (activeTool === 'draw' || activeTool === 'arrow' || activeTool === 'eraser')
                                            ? [{
                                                id: 'mock-tool',
                                                type: activeTool === 'draw' ? 'line' : activeTool,
                                                x: 0,
                                                y: 0,
                                                strokeColor: activeColor,
                                                strokeWidth: activeStrokeWidth,
                                            } as CanvasElement]
                                            : []
                                }
                                activeColor={activeColor}
                                activeStrokeWidth={activeStrokeWidth}
                                activeFontFamily={activeFontFamily}
                                handleColorSelect={handleColorSelect}
                                handleStrokeWidthChange={handleStrokeWidthChange}
                                handleFontChange={handleFontChange}
                                onDelete={() => removeElements(selectedIds)}
                                onGroup={() => groupElements?.(selectedIds)}
                                onUngroup={() => ungroupElements?.(selectedIds)}
                                onMoveZ={handleMoveZ}
                                onUpdateElement={updateElement}
                            />
                        )}
                    </div>

                    <div className="absolute top-24 md:top-auto md:bottom-8 right-4 md:right-8 pointer-events-none flex flex-col md:flex-row items-center gap-3 z-[70]">
                        <div className="relative pointer-events-auto" ref={helpRef}>
                            <button
                                onClick={() => setIsHelpOpen(!isHelpOpen)}
                                className={`size-10 md:size-12 rounded-full bg-white/60 backdrop-blur-md border border-black/5 shadow-soft flex items-center justify-center text-ink-light hover:text-ink transition-all hover:scale-110 active:scale-95 ${isHelpOpen ? 'bg-white shadow-md' : ''}`}
                                title="Raccourcis clavier"
                            >
                                <span className="material-symbols-outlined text-[20px] md:text-[24px]">help_outline</span>
                            </button>

                            {isHelpOpen && (
                                <div className="absolute bottom-12 md:bottom-14 right-0 w-64 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-black/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 z-50">
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
                                            { key: '⌘G', label: 'Grouper' },
                                            { key: '⌘⇧G', label: 'Dégrouper' },
                                            { key: '⌘Z', label: 'Annuler' },
                                            { key: '⌘⇧Z', label: 'Refaire' },
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
                            className="size-10 md:size-12 rounded-full bg-white/80 backdrop-blur-md border border-black/5 shadow-soft flex items-center justify-center pointer-events-auto text-ink-light hover:text-ink hover:bg-white transition-all hover:scale-110 active:scale-95"
                            title="Recadrer au centre"
                        >
                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">center_focus_strong</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mini-Map */}
            <MiniMap />
        </div>
    );
}
