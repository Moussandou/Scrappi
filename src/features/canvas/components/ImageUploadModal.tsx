"use client";

import { useState, useRef } from "react";

interface ImageUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (file: File) => void;
    uploading: boolean;
    storageMode?: 'cloud' | 'local';
}

export default function ImageUploadModal({ isOpen, onClose, onUpload, uploading, storageMode = 'cloud' }: ImageUploadModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) {
            onUpload(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
            <div
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-black/5 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="p-6 border-b border-black/5 flex items-center justify-between bg-white/50">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-sage">add_photo_alternate</span>
                        <h3 className="font-bold text-ink">Importer une image</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 flex items-center justify-center rounded-full hover:bg-black/5 text-ink-light transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className="p-8">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                            relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-300
                            ${isDragging
                                ? "border-sage bg-sage/5 scale-[1.02] shadow-inner-lg"
                                : "border-paper-dark bg-white hover:border-sage/50 hover:bg-paper/50"
                            }
                            ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}
                        `}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <span className="material-symbols-outlined animate-spin text-sage text-4xl">progress_activity</span>
                                <p className="text-sm font-medium text-ink-light">Téléversement en cours...</p>
                            </div>
                        ) : (
                            <>
                                <div className={`
                                    size-16 rounded-full flex items-center justify-center transition-colors
                                    ${isDragging ? "bg-sage text-white" : "bg-paper text-sage"}
                                `}>
                                    <span className="material-symbols-outlined text-3xl">
                                        {isDragging ? "download" : "cloud_upload"}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-ink">Glissez votre image ici</p>
                                    <p className="text-xs text-ink-light mt-1">PNG, JPG, WebP ou GIF animé</p>
                                </div>
                            </>
                        )}
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />

                    <div className="mt-6 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[10px] text-ink-light/60 font-medium uppercase tracking-wider">
                            <span className="h-px flex-1 bg-black/5"></span>
                            <span>{storageMode === 'local' ? 'Stockage Local' : 'Conseils'}</span>
                            <span className="h-px flex-1 bg-black/5"></span>
                        </div>
                        <ul className="grid grid-cols-2 gap-3">
                            <li className="flex items-center gap-2 text-[11px] text-ink-light">
                                <span className="material-symbols-outlined text-[14px] text-sage">check_circle</span>
                                PNG, JPG ou WEBP
                            </li>
                            <li className="flex items-center gap-2 text-[11px] text-ink-light">
                                <span className="material-symbols-outlined text-[14px] text-sage">check_circle</span>
                                {storageMode === 'local' ? "Aucune limite" : "Max 5 Mo recommandé"}
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="p-4 bg-white/30 border-t border-black/5 flex justify-center">
                    <p className="text-[10px] text-ink-light font-medium tracking-tight">
                        {storageMode === 'local'
                            ? "Vos images sont gardées sur votre PC."
                            : "Vos images sont stockées en toute sécurité dans votre projet Cloud."
                        }
                    </p>
                </div>
            </div>

            <style jsx>{`
                .shadow-inner-lg {
                    box-shadow: inset 0 4px 12px 0 rgba(0, 0, 0, 0.05);
                }
            `}</style>
        </div>
    );
}
