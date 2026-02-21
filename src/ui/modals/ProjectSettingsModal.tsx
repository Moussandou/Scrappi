"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Scrapbook } from '@/domain/entities';
import { useAuth } from '@/infra/auth/authContext';
import { uploadImage } from '@/infra/db/storageService';
import { BookBinder } from '@/ui/components/BookBinder';

export interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { title: string; binderColor: string; coverImage?: string; binderGrain?: number; coverZoom?: number; coverX?: number; coverY?: number }) => void;
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
    const [binderGrain, setBinderGrain] = useState(initialData?.binderGrain ?? 0.1);
    const [coverUrl, setCoverUrl] = useState(initialData?.coverImage || "");
    const [coverZoom, setCoverZoom] = useState(initialData?.coverZoom ?? 1);
    const [coverX, setCoverX] = useState(initialData?.coverX ?? 50);
    const [coverY, setCoverY] = useState(initialData?.coverY ?? 50);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setProjectTitle(initialData?.title || "");
            setSelectedColor(initialData?.binderColor || BINDER_COLORS[0].value);
            setBinderGrain(initialData?.binderGrain ?? 0.1);
            setCoverUrl(initialData?.coverImage || "");
            setCoverZoom(initialData?.coverZoom ?? 1);
            setCoverX(initialData?.coverX ?? 50);
            setCoverY(initialData?.coverY ?? 50);
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
            binderGrain: binderGrain,
            coverImage: coverUrl || undefined,
            coverZoom: coverZoom,
            coverX: coverX,
            coverY: coverY
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row bg-paper rounded-[32px] shadow-2xl overflow-hidden border border-paper-dark animate-in zoom-in-95 fade-in duration-300">
                <div className="paper-grain opacity-50"></div>

                {/* Left Side: Options (Scrollable) */}
                <div className="p-8 relative z-10 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-w-[320px]">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="font-serif text-3xl font-bold text-ink">{title}</h2>
                        {/* Close button inside options for mobile, hidden on desktop since we have one absolute or just keep it */}
                        <button onClick={onClose} className="md:hidden size-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="space-y-8 flex-1">
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
                                {/* Custom Color Picker */}
                                <div className={`relative size-12 rounded-xl transition-all border-2 flex items-center justify-center overflow-hidden cursor-pointer ${!BINDER_COLORS.some(c => c.value === selectedColor) ? 'border-sage scale-110 shadow-lg' : 'border-transparent shadow-sm'}`} title="Couleur personnalisée" style={{ backgroundColor: !BINDER_COLORS.some(c => c.value === selectedColor) ? selectedColor : '#ffffff' }}>
                                    <input
                                        type="color"
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="absolute inset-[-10px] w-[60px] h-[60px] cursor-pointer opacity-0"
                                    />
                                    {/* Icon visible only if no custom color selected yet */}
                                    {BINDER_COLORS.some(c => c.value === selectedColor) && (
                                        <span className="material-symbols-outlined text-ink/40 pointer-events-none z-10">palette</span>
                                    )}
                                    {!BINDER_COLORS.some(c => c.value === selectedColor) && (
                                        <span className="absolute inset-0 flex items-center justify-center text-sage pointer-events-none z-10">
                                            <span className="material-symbols-outlined text-[20px] bg-white rounded-full">check_circle</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Grain Selection */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest">Texture de la couverture (Grain)</label>
                                <span className="text-xs text-ink-light font-bold">{Math.round(binderGrain * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={binderGrain}
                                onChange={(e) => setBinderGrain(parseFloat(e.target.value))}
                                className="w-full h-2 bg-sage/20 rounded-lg appearance-none cursor-pointer accent-sage"
                            />
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

                        {/* Image Repositioning Controls (Visible only if cover image exists) */}
                        {coverUrl && (
                            <div className="space-y-4 p-4 bg-sage/5 rounded-2xl border border-sage/10 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest ml-1">Ajustement de l&apos;image</label>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] text-ink-light/60 font-bold uppercase">
                                        <span>Zoom</span>
                                        <span>{Math.round(coverZoom * 100)}%</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="3" step="0.05"
                                        value={coverZoom}
                                        onChange={(e) => setCoverZoom(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-sage/20 rounded-lg appearance-none cursor-pointer accent-sage"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] text-ink-light/60 font-bold uppercase">
                                            <span>Position X</span>
                                            <span>{Math.round(coverX)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100" step="1"
                                            value={coverX}
                                            onChange={(e) => setCoverX(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-sage/20 rounded-lg appearance-none cursor-pointer accent-sage"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] text-ink-light/60 font-bold uppercase">
                                            <span>Position Y</span>
                                            <span>{Math.round(coverY)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100" step="1"
                                            value={coverY}
                                            onChange={(e) => setCoverY(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-sage/20 rounded-lg appearance-none cursor-pointer accent-sage"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex gap-4 shrink-0">
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

                {/* Right Side: Live Preview */}
                <div className="relative z-10 hidden md:flex w-1/2 bg-paper-dark/30 border-l border-paper-dark flex-col items-center justify-center p-12">
                    <button onClick={onClose} className="absolute top-6 right-6 size-10 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>

                    <div className="w-full max-w-[280px]">
                        <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest text-center mb-6">Aperçu du classeur</p>

                        <div className="relative w-full aspect-[3/4] mx-auto perspective-[2000px]">
                            <BookBinder
                                scrapbook={{
                                    title: projectTitle,
                                    binderColor: selectedColor,
                                    binderGrain: binderGrain,
                                    coverImage: coverUrl || undefined,
                                    coverZoom: coverZoom,
                                    coverX: coverX,
                                    coverY: coverY
                                }}
                                showDetails={true}
                                interactive={false}
                                className="pointer-events-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
