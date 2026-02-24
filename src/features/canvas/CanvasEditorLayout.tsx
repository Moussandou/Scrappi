"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CanvasElement, Scrapbook } from "@/domain/entities";
import { getScrapbook, getElements, saveElements, updateScrapbook } from "@/infra/db/firestoreService";
import { useStorageMode } from "./hooks/useStorageMode";
import { useAuth } from "@/infra/auth/authContext";

import EditorHeader from "./components/EditorHeader";
import Toolbar from "./components/Toolbar";
import ProjectSidebar from "./components/ProjectSidebar";
import FloatingContextHUD from "./components/FloatingContextHUD";
import StickerTray from "./components/StickerTray";
import ImageUploadModal from "./components/ImageUploadModal";
import VideoUploadModal from "./components/VideoUploadModal";
import { PaperType } from "./components/PaperSelector";
import { resizeDimensions } from "./utils";

// Dynamic import for Konva canvas to avoid SSR issues
const Canvas = dynamic(() => import("./components/CanvasStage"), { ssr: false });

export default function CanvasEditorLayout({ projectId }: { projectId: string }) {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const [history, setHistory] = useState<CanvasElement[][]>([[]]);
    const [historyStep, setHistoryStep] = useState(0);
    const elements = useMemo(() => history[historyStep] || [], [history, historyStep]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const setElements = useCallback((action: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
        const currentState = elements;
        const nextState = typeof action === 'function' ? action(currentState) : action;

        if (JSON.stringify(currentState) === JSON.stringify(nextState)) return;

        setHistory(prev => {
            const nextHistory = prev.slice(0, historyStep + 1);
            nextHistory.push(nextState);
            return nextHistory;
        });
        setHistoryStep(historyStep + 1);
    }, [elements, historyStep]);

    // Auth protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    const handleUndo = useCallback(() => {
        if (historyStep > 0) {
            setHistoryStep(historyStep - 1);
        }
    }, [historyStep]);

    const handleRedo = useCallback(() => {
        if (historyStep < history.length - 1) {
            setHistoryStep(historyStep + 1);
        }
    }, [historyStep, history.length]);

    const storageMode = useStorageMode();

    const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadLabel, setUploadLabel] = useState('');
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState("");

    const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'arrow' | 'eraser' | 'hand'>('select');
    const [activeColor, setActiveColor] = useState('#1a1e26');
    const [activeStrokeWidth, setActiveStrokeWidth] = useState(4);
    const [activeFontFamily, setActiveFontFamily] = useState('Inter');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isStickerTrayOpen, setIsStickerTrayOpen] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [paperType, setPaperType] = useState<PaperType>('watercolor');
    const [paperColor, setPaperColor] = useState<string>('#ffffff'); // Default to white
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


    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const fetchedScrapbook = await getScrapbook(projectId);
                setScrapbook(fetchedScrapbook);
                if (fetchedScrapbook?.backgroundColor) {
                    setPaperColor(fetchedScrapbook.backgroundColor);
                }
                if (fetchedScrapbook?.paperType) {
                    setPaperType(fetchedScrapbook.paperType as PaperType);
                }

                const fetchedElements = await getElements(projectId);
                setHistory([fetchedElements]);
                setHistoryStep(0);

                // Intelligent centering after data load - using setTimeout to ensure DOM is ready
                setTimeout(() => {
                    if (fetchedElements.length > 0) {
                        const viewportWidth = window.innerWidth;
                        const viewportHeight = window.innerHeight;

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

                        setScale(newScale);
                        setPosition({
                            x: (viewportWidth / 2) - (minX + contentWidth / 2) * newScale,
                            y: (viewportHeight / 2) - (minY + contentHeight / 2) * newScale
                        });
                    } else {
                        setPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                        setScale(1);
                    }
                }, 50);
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
                } else if (e.key.toLowerCase() === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) handleRedo();
                    else handleUndo();
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
    }, [isHelpOpen, handleUndo, handleRedo, setElements]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (user) {
                // Save elements
                await saveElements(projectId, elements, user.uid);
                // Save scrapbook metadata (like background color)
                await updateScrapbook(projectId, {
                    backgroundColor: paperColor,
                    paperType: paperType // Also saving paperType preference
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

    const handleElementChange = (id: string, partial: Partial<CanvasElement>) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...partial } : el));
    };

    const handleElementsChange = (changes: Array<{ id: string, partial: Partial<CanvasElement> }>) => {
        setElements(prev => prev.map(el => {
            const change = changes.find(c => c.id === el.id);
            if (change) {
                return { ...el, ...change.partial };
            }
            return el;
        }));
    };

    const handleRecenter = () => {
        if (typeof window === "undefined") return;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        if (elements.length > 0) {
            // Calculate bounding box of all elements
            const minX = Math.min(...elements.map(el => el.x));
            const minY = Math.min(...elements.map(el => el.y));
            const maxX = Math.max(...elements.map(el => el.x + (el.width || 0)));
            const maxY = Math.max(...elements.map(el => el.y + (el.height || 0)));

            const contentWidth = maxX - minX;
            const contentHeight = maxY - minY;

            // Fit content in viewport with some padding
            const padding = 40;
            const scaleX = (viewportWidth - padding * 2) / contentWidth;
            const scaleY = (viewportHeight - padding * 2) / contentHeight;
            const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.1), 1.5);

            setScale(newScale);
            setPosition({
                x: (viewportWidth / 2) - (minX + contentWidth / 2) * newScale,
                y: (viewportHeight / 2) - (minY + contentHeight / 2) * newScale
            });
        } else {
            // Just center the origin
            setScale(1);
            setPosition({ x: viewportWidth / 2, y: viewportHeight / 2 });
        }
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
            setElements(prev => prev.map(el => {
                if (selectedIds.includes(el.id) && (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser')) {
                    return { ...el, strokeWidth: width };
                }
                return el;
            }));
        }
    };

    const handleColorSelect = (colorValue: string) => {
        setActiveColor(colorValue);

        if (selectedIds.length > 0) {
            setElements(prev => prev.map(el => {
                if (selectedIds.includes(el.id)) {
                    if (el.type === 'text' && el.backgroundColor) {
                        return { ...el, backgroundColor: colorValue };
                    } else if (el.type !== 'image' && el.type !== 'sticker') {
                        return { ...el, strokeColor: colorValue };
                    }
                }
                return el;
            }));
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

    const handleFileSelection = async (file: File) => {
        setIsImageModalOpen(false);
        setUploading(true);
        setUploadProgress(0);
        setUploadLabel('image');
        try {
            const url = await storageMode.uploadFile(file, `projects/${projectId}`, (p) => setUploadProgress(Math.round(p)));
            const img = new window.Image();
            img.src = url;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const maxSize = 400;
            const { width: finalWidth, height: finalHeight } = resizeDimensions(img.width, img.height, maxSize);

            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const isGif = file.type === 'image/gif';
            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: isGif ? "gif" : "image",
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
        }
    };

    const handleVideoSelection = async (file: File) => {
        setIsVideoModalOpen(false);
        setUploading(true);
        setUploadProgress(0);
        setUploadLabel('vid\u00e9o');
        try {
            const url = await storageMode.uploadFile(file, `projects/${projectId}/videos`, (p) => setUploadProgress(Math.round(p)));

            // Create a video element to get dimensions
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.preload = 'metadata';

            const metadataLoaded = new Promise((resolve) => {
                video.onloadedmetadata = () => resolve(true);
                video.onerror = (e) => {
                    console.error("Erreur gérée pendant le preload de la vidéo :", e);
                    resolve(false);
                };
            });

            video.src = url;
            video.load();
            await metadataLoaded;

            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 360;

            // Scale down only if the video is larger than 80% of the viewport
            const maxW = typeof window !== "undefined" ? window.innerWidth * 0.6 : 800;
            const maxH = typeof window !== "undefined" ? window.innerHeight * 0.6 : 600;

            const { width: finalWidth, height: finalHeight } = resizeDimensions(videoWidth, videoHeight, maxW, maxH);

            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "video",
                content: url,
                x: (x - position.x) / scale,
                y: (y - position.y) / scale,
                width: finalWidth,
                height: finalHeight,
                rotation: 0,
                zIndex: elements.length + 1,
                muted: true, // Default to muted for autoplay support
                loop: true,
            };
            setElements(prev => [...prev, newElement]);
        } catch (error) {
            console.error("Failed to upload video", error);
            alert("Erreur lors de l'upload de la vidéo.");
        } finally {
            setUploading(false);
        }
    };

    const handleAddSticker = async (url: string) => {
        setUploading(true);
        try {
            const img = new window.Image();
            img.src = url;
            // For pixels to be readable if we ever add effects back
            img.crossOrigin = "anonymous";
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const maxSize = 250; // Stickers are usually smaller
            const { width: finalWidth, height: finalHeight } = resizeDimensions(img.width, img.height, maxSize);

            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "sticker",
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
            console.error("Failed to add sticker", error);
        } finally {
            setUploading(false);
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
            const url = await storageMode.uploadFile(file, `projects/${projectId}`);
            const img = new window.Image();
            img.src = url;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const maxSize = 400;
            const { width: finalWidth, height: finalHeight } = resizeDimensions(img.width, img.height, maxSize);

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

    const handleDeleteSelected = () => {
        if (selectedIdsRef.current.length === 0) return;
        setElements(prev => prev.filter(el => !selectedIdsRef.current.includes(el.id)));
        setSelectedIds([]);
    };

    const handleMoveZ = (direction: 'forward' | 'backward' | 'front' | 'back') => {
        if (selectedIdsRef.current.length === 0) return;

        setElements(prev => {
            const next = [...prev];
            const selectedIndices = selectedIdsRef.current
                .map(id => next.findIndex(el => el.id === id))
                .filter(idx => idx !== -1)
                .sort((a, b) => a - b);

            if (selectedIndices.length === 0) return next;

            if (direction === 'front') {
                const selectedElements = selectedIndices.map(idx => next[idx]);
                const remainingElements = next.filter((_, idx) => !selectedIndices.includes(idx));
                return [...remainingElements, ...selectedElements];
            } else if (direction === 'back') {
                const selectedElements = selectedIndices.map(idx => next[idx]);
                const remainingElements = next.filter((_, idx) => !selectedIndices.includes(idx));
                return [...selectedElements, ...remainingElements];
            } else if (direction === 'forward') {
                const maxIdx = Math.max(...selectedIndices);
                if (maxIdx < next.length - 1) {
                    // Pull the element at maxIdx + 1 down, move selection up
                    const selectedSet = new Set(selectedIdsRef.current);

                    // Insert the target item before the selection in the new order
                    // Actually, simpler: find the next non-selected index
                    let nextNonSelected = -1;
                    for (let i = maxIdx + 1; i < next.length; i++) {
                        if (!selectedSet.has(next[i].id)) {
                            nextNonSelected = i;
                            break;
                        }
                    }

                    if (nextNonSelected !== -1) {
                        const newElements = [...next];
                        const selectedItems = selectedIndices.map(i => newElements[i]);
                        const swappedItem = newElements[nextNonSelected];

                        // We want to move the block past swappedItem
                        // Remove selected items
                        const filtered = newElements.filter((_, i) => !selectedIndices.includes(i));
                        // Find index of swappedItem in filtered
                        const insertIdx = filtered.findIndex(el => el.id === swappedItem.id);
                        filtered.splice(insertIdx + 1, 0, ...selectedItems);
                        return filtered;
                    }
                }
            } else if (direction === 'backward') {
                const minIdx = Math.min(...selectedIndices);
                if (minIdx > 0) {
                    const selectedSet = new Set(selectedIdsRef.current);
                    let prevNonSelected = -1;
                    for (let i = minIdx - 1; i >= 0; i--) {
                        if (!selectedSet.has(next[i].id)) {
                            prevNonSelected = i;
                            break;
                        }
                    }

                    if (prevNonSelected !== -1) {
                        const newElements = [...next];
                        const selectedItems = selectedIndices.map(i => newElements[i]);
                        const swappedItem = newElements[prevNonSelected];

                        const filtered = newElements.filter((_, i) => !selectedIndices.includes(i));
                        const insertIdx = filtered.findIndex(el => el.id === swappedItem.id);
                        filtered.splice(insertIdx, 0, ...selectedItems);
                        return filtered;
                    }
                }
            }
            return next;
        });
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

    const getBgClass = () => {
        return paperType === 'kraft' ? 'kraft-paper' : 'bg-paper';
    };

    return (
        <div
            className={`${getBgClass()} min-h-screen relative overflow-hidden font-sans transition-colors duration-500`}
            style={paperColor ? { backgroundColor: paperColor } : {}}
        >
            {/* Background Base Texture & Grid */}
            <div className={`fixed inset-0 pointer-events-none opacity-40 z-0 mix-blend-multiply sketchbook-grid ${paperType === 'kraft' ? 'opacity-20' : ''}`}></div>

            {/* Top Paper Grain (Mixed with content for realism) */}
            {/* Moved behind canvas so it doesn't affect images/opaque elements */}
            <div className={`fixed inset-0 pointer-events-none z-10 ${getPaperClass()}`}></div>

            {/* Main Drawing Area */}
            <div
                className="absolute inset-0 z-20"
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
                    onElementsChange={handleElementsChange}
                />
            </div>



            <div className="fixed inset-0 z-50 pointer-events-none">
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

                <div className="absolute inset-0 pointer-events-none">
                    <div className="flex-1 flex items-start justify-start gap-4 px-8 mt-4">
                        <Toolbar
                            activeTool={activeTool}
                            setActiveTool={setActiveTool}
                            handleDelete={handleDelete}
                            selectedIds={selectedIds}
                            addTextElement={addTextElement}
                            toggleStickerTray={() => setIsStickerTrayOpen(!isStickerTrayOpen)}
                            isStickerTrayOpen={isStickerTrayOpen}
                            openImageModal={() => setIsImageModalOpen(true)}
                            openVideoModal={() => setIsVideoModalOpen(true)}
                        />

                        <StickerTray
                            isOpen={isStickerTrayOpen}
                            onClose={() => setIsStickerTrayOpen(false)}
                            onSelectSticker={handleAddSticker}
                        />

                        <ImageUploadModal
                            isOpen={isImageModalOpen}
                            onClose={() => setIsImageModalOpen(false)}
                            onUpload={handleFileSelection}
                            uploading={uploading}
                            storageMode={storageMode.mode}
                        />

                        <VideoUploadModal
                            isOpen={isVideoModalOpen}
                            onClose={() => setIsVideoModalOpen(false)}
                            onUpload={handleVideoSelection}
                            uploading={uploading}
                            storageMode={storageMode.mode}
                        />

                        {uploading && (
                            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
                                <div className="bg-ink text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[260px]">
                                    <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">
                                            Import {uploadLabel} en cours...
                                        </p>
                                        <div className="mt-1.5 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-sage rounded-full transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-white/60 mt-1">{uploadProgress}%</p>
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
                            isStickerTrayOpen={isStickerTrayOpen}
                        />

                        <FloatingContextHUD
                            selectedElements={elements.filter(el => selectedIds.includes(el.id))}
                            activeColor={activeColor}
                            activeStrokeWidth={activeStrokeWidth}
                            activeFontFamily={activeFontFamily}
                            handleColorSelect={handleColorSelect}
                            handleStrokeWidthChange={handleStrokeWidthChange}
                            handleFontChange={handleFontChange}
                            onDelete={handleDeleteSelected}
                            onMoveZ={handleMoveZ}
                            onUpdateElement={handleElementChange}
                        />
                    </div>

                    {/* Bottom Right Controls (Help & Recenter) - Moved to top on mobile for visibility */}
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
                            className="size-10 md:size-12 rounded-full bg-white/80 backdrop-blur-md border border-black/5 shadow-soft flex items-center justify-center pointer-events-auto text-ink-light hover:text-ink hover:bg-white transition-all hover:scale-110 active:scale-95"
                            title="Recadrer au centre"
                        >
                            <span className="material-symbols-outlined text-[20px] md:text-[24px]">center_focus_strong</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
