"use client";

import { RefObject } from "react";

interface ToolbarProps {
    activeTool: 'select' | 'draw' | 'arrow' | 'eraser' | 'hand';
    setActiveTool: (tool: 'select' | 'draw' | 'arrow' | 'eraser' | 'hand') => void;
    handleDelete: () => void;
    selectedIds: string[];
    addTextElement: (isPostIt: boolean) => void;
    toggleStickerTray: () => void;
    isStickerTrayOpen: boolean;
    openImageModal: () => void;
    openVideoModal?: () => void;
}

export default function Toolbar({
    activeTool,
    setActiveTool,
    handleDelete,
    selectedIds,
    addTextElement,
    toggleStickerTray,
    isStickerTrayOpen,
    openImageModal,
    openVideoModal
}: ToolbarProps) {
    return (
        <div className="flex-1 flex items-start justify-start gap-4 mt-4">
            <div className="pointer-events-auto flex flex-col gap-4">
                <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2.5 rounded-2xl border border-black/5 shadow-soft">
                    {/* ... other buttons ... */}
                    <button
                        onClick={() => setActiveTool('hand')}
                        className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'hand' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}
                        title="Main (Déplacer le canevas)"
                    >
                        <span className="material-symbols-outlined">back_hand</span>
                    </button>
                    <button
                        onClick={() => setActiveTool('select')}
                        className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'select' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}
                        title="Sélectionner / Déplacer (V)"
                    >
                        <span className="material-symbols-outlined">near_me</span>
                    </button>
                    <button
                        onClick={() => setActiveTool('draw')}
                        className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'draw' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}
                        title="Crayon / Dessiner (P)"
                    >
                        <span className="material-symbols-outlined">brush</span>
                    </button>
                    <button
                        onClick={() => setActiveTool('arrow')}
                        className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'arrow' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}
                        title="Flèche d'annotation (A)"
                    >
                        <span className="material-symbols-outlined">east</span>
                    </button>
                    <button
                        onClick={() => setActiveTool('eraser')}
                        className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${activeTool === 'eraser' ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}
                        title="Gomme (E)"
                    >
                        <span className="material-symbols-outlined">ink_eraser</span>
                    </button>

                    <div className="h-px w-6 bg-ink/10 self-center my-1"></div>

                    <button
                        onClick={toggleStickerTray}
                        className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-all hover:scale-105 pointer-events-auto ${isStickerTrayOpen ? 'bg-sage text-white' : 'text-ink-light hover:text-ink hover:bg-black/5'}`}
                        title="Ajouter une illustration"
                    >
                        <span className="material-symbols-outlined">palette</span>
                    </button>

                    <button
                        onClick={openImageModal}
                        className="size-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 pointer-events-auto border-2 border-dashed border-sage/30 text-sage hover:border-sage hover:bg-sage/5"
                        title="Importer une image"
                    >
                        <span className="material-symbols-outlined">
                            add_photo_alternate
                        </span>
                    </button>

                    <button
                        onClick={openVideoModal}
                        className="size-11 rounded-xl flex items-center justify-center transition-all hover:scale-105 pointer-events-auto border-2 border-dashed border-sage/30 text-sage hover:border-sage hover:bg-sage/5"
                        title="Importer une vidéo (max 50MB)"
                    >
                        <span className="material-symbols-outlined">
                            video_file
                        </span>
                    </button>

                    <div className="h-px w-6 bg-ink/10 self-center my-1"></div>

                    <button
                        onClick={() => addTextElement(true)}
                        className="size-11 rounded-xl text-ink-light hover:text-ink hover:bg-black/5 flex items-center justify-center transition-colors pointer-events-auto"
                        title="Ajouter un post-it"
                    >
                        <span className="material-symbols-outlined">sticky_note_2</span>
                    </button>
                    <button
                        onClick={() => addTextElement(false)}
                        className="size-11 rounded-xl text-ink-light hover:text-ink hover:bg-black/5 flex items-center justify-center transition-colors pointer-events-auto"
                        title="Ajouter du texte"
                    >
                        <span className="material-symbols-outlined">title</span>
                    </button>

                    <div className="h-px w-6 bg-ink/10 self-center my-1"></div>

                    <button
                        onClick={handleDelete}
                        disabled={selectedIds.length === 0}
                        className={`size-11 rounded-xl shadow-sm flex items-center justify-center transition-transform hover:scale-105 pointer-events-auto ${selectedIds.length > 0 ? 'text-red-500 hover:bg-red-50' : 'text-ink-light opacity-30 cursor-not-allowed'}`}
                        title="Supprimer la sélection"
                    >
                        <span className="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
