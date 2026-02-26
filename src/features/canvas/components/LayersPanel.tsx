"use client";

import { useCanvasStore } from "../store/useCanvasStore";
import { CanvasElement } from "@/domain/entities";
import { useState } from "react";

interface LayersPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LayersPanel({ isOpen, onClose }: LayersPanelProps) {
    const { elements, selectedIds, setSelectedIds, updateElement } = useCanvasStore();
    const [draggedId, setDraggedId] = useState<string | null>(null);

    if (!isOpen) return null;

    // Trier les éléments du plus haut z-index au plus bas (comme Photoshop)
    const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

    const handleSelect = (id: string, multi: boolean) => {
        if (multi) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds([id]);
        }
    };

    const toggleHide = (e: React.MouseEvent, el: CanvasElement) => {
        e.stopPropagation();
        updateElement(el.id, { isHidden: !el.isHidden });
    };

    const toggleLock = (e: React.MouseEvent, el: CanvasElement) => {
        e.stopPropagation();
        updateElement(el.id, { isLocked: !el.isLocked });
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'text': return 'title';
            case 'image': return 'image';
            case 'video': return 'movie';
            case 'gif': return 'gif';
            case 'sticker': return 'star';
            case 'line': return 'edit';
            case 'arrow': return 'east';
            default: return 'layers';
        }
    };

    const getNameForElement = (el: CanvasElement) => {
        if (el.name) return el.name;
        if (el.type === 'text') {
            return el.content.slice(0, 15) + (el.content.length > 15 ? '...' : '') || 'Texte vide';
        }
        return `Calque ${el.type}`;
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        // Hack for styling the drag ghost
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        setDraggedId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const elementsCopy = [...sortedElements];
        const draggedIndex = elementsCopy.findIndex(el => el.id === draggedId);
        const targetIndex = elementsCopy.findIndex(el => el.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Visual rules: 
        // Elements at index 0 are visually HIGHEST z-index
        // We splice and insert.
        const [draggedItem] = elementsCopy.splice(draggedIndex, 1);
        elementsCopy.splice(targetIndex, 0, draggedItem);

        // Reassign exact z-indexes from bottom to top
        // lowest visual index = highest zIndex
        // highest visual index = lowest zIndex
        const reversed = [...elementsCopy].reverse();
        // Keep existing lowest z-index but increment
        const baseZ = Math.min(...elements.map(e => e.zIndex)) || 1;

        useCanvasStore.getState().updateElements(
            reversed.map((el, index) => ({
                id: el.id,
                partial: { zIndex: baseZ + index }
            }))
        );

        setDraggedId(null);
    };

    return (
        <div className="fixed right-4 top-20 bottom-24 w-64 bg-white/95 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl flex flex-col overflow-hidden z-[95] animate-in slide-in-from-right-4 fade-in duration-300 pointer-events-auto">
            {/* Header */}
            <div className="p-4 border-b border-black/5 flex items-center justify-between bg-black/5">
                <h3 className="font-serif italic font-bold text-ink text-lg">Calques</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 text-ink-light transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                {sortedElements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">layers_clear</span>
                        <p className="text-xs font-bold text-ink">Aucun élément</p>
                    </div>
                ) : (
                    sortedElements.map(el => {
                        const isSelected = selectedIds.includes(el.id);
                        return (
                            <div
                                key={el.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, el.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, el.id)}
                                onClick={(e) => handleSelect(el.id, e.shiftKey || e.metaKey || e.ctrlKey)}
                                className={`group flex items-center gap-2 p-2 rounded-xl text-sm transition-colors cursor-pointer border ${isSelected ? 'bg-sage/10 border-sage/30' : 'hover:bg-black/5 border-transparent'} ${el.isHidden ? 'opacity-50' : ''}`}
                            >
                                <span className={`material-symbols-outlined cursor-grab active:cursor-grabbing text-[14px] text-ink-light/50 hover:text-ink`}>
                                    drag_indicator
                                </span>
                                <span className={`material-symbols-outlined text-[16px] ${isSelected ? 'text-sage' : 'text-ink-light'}`}>
                                    {getIconForType(el.type)}
                                </span>

                                <span className="flex-1 truncate font-medium text-ink text-xs">
                                    {getNameForElement(el)}
                                </span>

                                <div className={`flex items-center gap-1 transition-opacity ${el.isLocked || el.isHidden || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <button
                                        onClick={(e) => toggleLock(e, el)}
                                        className={`p-1 rounded hover:bg-black/10 transition-colors ${el.isLocked ? 'text-red-500' : 'text-ink-light hover:text-ink'}`}
                                        title={el.isLocked ? "Déverrouiller" : "Verrouiller"}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {el.isLocked ? 'lock' : 'lock_open'}
                                        </span>
                                    </button>
                                    <button
                                        onClick={(e) => toggleHide(e, el)}
                                        className={`p-1 rounded hover:bg-black/10 transition-colors ${el.isHidden ? 'text-sage' : 'text-ink-light hover:text-ink'}`}
                                        title={el.isHidden ? "Afficher" : "Masquer"}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {el.isHidden ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
