"use client";

import { useState, useRef, useEffect } from "react";
import { uploadImage } from "@/infra/db/storageService";
import { Scrapbook } from "@/domain/entities";

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { title: string; binderColor: string; coverImage?: string }) => void;
    initialData?: Scrapbook;
    title: string;
}

const BINDER_COLORS = [
    { name: "Crème", value: "#e8e4dc", shadow: "#8B4513" },
    { name: "Forêt", value: "#3a4a3a", shadow: "#1a2a1a" },
    { name: "Sable", value: "#c7bca5", shadow: "#8c7b5d" },
    { name: "Ciel", value: "#dbeafe", shadow: "#93c5fd" },
    { name: "Pétale", value: "#fce7f3", shadow: "#f9a8d4" },
    { name: "Encre", value: "#1a1e26", shadow: "#000000" },
];

export default function ProjectModal({ isOpen, onClose, onConfirm, initialData, title }: ProjectModalProps) {
    const [projectTitle, setProjectTitle] = useState(initialData?.title || "");
    const [selectedColor, setSelectedColor] = useState(initialData?.binderColor || BINDER_COLORS[0].value);
    const [coverUrl, setCoverUrl] = useState(initialData?.coverImage || "");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setProjectTitle(initialData?.title || "");
            setSelectedColor(initialData?.binderColor || BINDER_COLORS[0].value);
            setCoverUrl(initialData?.coverImage || "");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, "covers");
            setCoverUrl(url);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Erreur lors de l'upload de l'image.");
        } finally {
            setUploading(false);
        }
    };

    const handleConfirm = () => {
        if (!projectTitle.trim()) {
            alert("Veuillez donner un nom à votre classeur.");
            return;
        }
        onConfirm({
            title: projectTitle,
            binderColor: selectedColor,
            coverImage: coverUrl || undefined
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-paper rounded-[32px] shadow-2xl overflow-hidden border border-paper-dark animate-in zoom-in-95 fade-in duration-300">
                <div className="paper-grain opacity-50"></div>

                <div className="p-8 relative z-10">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="font-serif text-3xl font-bold text-ink">{title}</h2>
                        <button onClick={onClose} className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Title Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest ml-1">Nom du classeur</label>
                            <input
                                type="text"
                                value={projectTitle}
                                onChange={(e) => setProjectTitle(e.target.value)}
                                placeholder="Mon Carnet de Voyage..."
                                className="w-full bg-white/50 border border-black/5 rounded-2xl py-4 px-6 outline-none focus:bg-white focus:border-sage/30 transition-all text-lg font-serif italic text-ink"
                            />
                        </div>

                        {/* Color Selection */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest ml-1">Style de la couverture</label>
                            <div className="flex flex-wrap gap-3">
                                {BINDER_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setSelectedColor(color.value)}
                                        className={`size-12 rounded-xl transition-all relative border-2 ${selectedColor === color.value ? 'border-sage scale-110 shadow-lg' : 'border-transparent shadow-sm'}`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    >
                                        {selectedColor === color.value && (
                                            <span className="absolute inset-0 flex items-center justify-center text-sage">
                                                <span className="material-symbols-outlined text-[20px] bg-white rounded-full">check_circle</span>
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest ml-1">Image de couverture (Optionnel)</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="relative aspect-video w-full rounded-2xl border-2 border-dashed border-sage/20 bg-sage/5 hover:bg-sage/10 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center group"
                            >
                                {coverUrl ? (
                                    <>
                                        <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center flex-col gap-2 text-white">
                                            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                                            <span className="text-xs font-medium">Changer l&apos;image</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-3xl text-sage/40 mb-2">{uploading ? "hourglass_empty" : "add_a_photo"}</span>
                                        <span className="text-xs text-ink-light font-medium">{uploading ? "Upload en cours..." : "Ajouter une image"}</span>
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 rounded-2xl border border-black/5 font-bold text-ink-light hover:bg-black/5 transition-all uppercase tracking-widest text-xs"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={uploading}
                            className="flex-1 py-4 rounded-2xl bg-sage text-white font-bold shadow-soft hover:bg-opacity-90 transition-all uppercase tracking-widest text-xs shadow-sage/20 disabled:opacity-50"
                        >
                            Confirmer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
