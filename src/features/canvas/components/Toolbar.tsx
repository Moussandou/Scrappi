"use client";

import { RefObject } from "react";

interface ToolbarProps {
    activeTool: 'select' | 'draw' | 'arrow' | 'eraser' | 'hand';
    setActiveTool: (tool: 'select' | 'draw' | 'arrow' | 'eraser' | 'hand') => void;
    handleDelete: () => void;
    selectedIds: string[];
    fileInputRef: RefObject<HTMLInputElement | null>;
    uploading: boolean;
    addTextElement: (isPostIt: boolean) => void;
}

export default function Toolbar({
    activeTool,
    setActiveTool,
    handleDelete,
    selectedIds,
    fileInputRef,
    uploading,
    addTextElement
}: ToolbarProps) {
    return (
        <div className="flex-1 flex items-start justify-start gap-4 px-8 mt-4">
            <div className="pointer-events-auto flex flex-col gap-4">
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
            {/* HUD will be rendered separately if needed or as a child */}
        </div>
    );
}
