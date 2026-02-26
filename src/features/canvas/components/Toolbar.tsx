"use client";

import { ToolbarButton } from "./ToolbarButton";

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
        <div className="pointer-events-auto flex flex-col md:gap-4 fixed bottom-4 left-1/2 -translate-x-1/2 w-fit max-w-[calc(100%-2rem)] md:relative md:bottom-auto md:left-auto md:right-auto md:translate-x-0 md:mt-4 z-[60]">
            <div className="flex flex-row md:flex-col gap-1.5 md:gap-2 bg-white/80 backdrop-blur-md p-1.5 md:p-2.5 rounded-2xl border border-black/5 shadow-soft overflow-x-auto md:overflow-x-visible no-scrollbar">
                <ToolbarButton
                    onClick={() => setActiveTool('hand')}
                    isActive={activeTool === 'hand'}
                    title="Main / Pan (H)"
                    icon="back_hand"
                    label="Main"
                />
                <ToolbarButton
                    onClick={() => setActiveTool('select')}
                    isActive={activeTool === 'select'}
                    title="Sélectionner / Déplacer (V)"
                    icon="near_me"
                    label="Sélect."
                />
                <ToolbarButton
                    onClick={() => setActiveTool('draw')}
                    isActive={activeTool === 'draw'}
                    title="Crayon / Dessiner (B)"
                    icon="brush"
                    label="Dessin"
                />
                <ToolbarButton
                    onClick={() => setActiveTool('arrow')}
                    isActive={activeTool === 'arrow'}
                    title="Flèche d'annotation (A)"
                    icon="east"
                    label="Flèche"
                />
                <ToolbarButton
                    onClick={() => setActiveTool('eraser')}
                    isActive={activeTool === 'eraser'}
                    title="Gomme (E)"
                    icon="ink_eraser"
                    label="Gomme"
                />

                <div className="h-4 w-px md:h-px md:w-6 bg-ink/10 self-center mx-1 md:mx-0 md:my-1"></div>

                <ToolbarButton
                    onClick={toggleStickerTray}
                    isActive={isStickerTrayOpen}
                    title="Ajouter une illustration"
                    icon="palette"
                    label="Sticker"
                />

                <ToolbarButton
                    onClick={openImageModal}
                    title="Importer une image"
                    icon="add_photo_alternate"
                    variant="action"
                    label="Image"
                />

                <ToolbarButton
                    onClick={openVideoModal}
                    title="Importer une vidéo (max 50MB)"
                    icon="video_file"
                    variant="action"
                    label="Vidéo"
                />

                <div className="h-4 w-px md:h-px md:w-6 bg-ink/10 self-center mx-1 md:mx-0 md:my-1"></div>

                <ToolbarButton
                    onClick={() => addTextElement(true)}
                    title="Ajouter un post-it"
                    icon="sticky_note_2"
                    variant="simple"
                    label="Note"
                />
                <ToolbarButton
                    onClick={() => addTextElement(false)}
                    title="Ajouter du texte"
                    icon="title"
                    variant="simple"
                    label="Texte"
                />

                <div className="h-4 w-px md:h-px md:w-6 bg-ink/10 self-center mx-1 md:mx-0 md:my-1"></div>

                <ToolbarButton
                    onClick={handleDelete}
                    disabled={selectedIds.length === 0}
                    title="Supprimer la sélection"
                    icon="delete"
                    variant="delete"
                    label="Suppr."
                />
            </div>
        </div>
    );
}
