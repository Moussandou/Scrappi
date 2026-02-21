"use client";

import { useState, useRef, useEffect } from "react";
import { uploadImage } from "@/infra/db/storageService";
import { Scrapbook } from "@/domain/entities";

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { title: string; binderColor: string; coverImage?: string; binderGrain?: number }) => void;
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
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setProjectTitle(initialData?.title || "");
            setSelectedColor(initialData?.binderColor || BINDER_COLORS[0].value);
            setBinderGrain(initialData?.binderGrain ?? 0.1);
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
            binderGrain: binderGrain,
            coverImage: coverUrl || undefined
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

                        <div className="relative aspect-[3/4] rounded-r-2xl rounded-l-sm shadow-xl border-l-[12px] border-l-black/20 overflow-hidden mx-auto transition-all duration-300" style={{ backgroundColor: selectedColor }}>
                            {/* Leather Texture */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-10 mix-blend-overlay z-10"></div>

                            {/* Grain Texture */}
                            <div className="absolute inset-0 binder-grain mix-blend-overlay pointer-events-none z-10 transition-opacity duration-300" style={{ opacity: binderGrain }}></div>

                            {/* Spine shadow */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10"></div>

                            {/* Metal Rings */}
                            <div className="absolute left-0 top-[12%] bottom-[12%] flex flex-col justify-between py-4 z-30 pointer-events-none">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="flex flex-col gap-[2px]">
                                        <div className="w-5 h-1.5 bg-gradient-to-r from-[#9ca3af] via-[#f3f4f6] to-[#6b7280] shadow-[2px_2px_3px_rgba(0,0,0,0.4)] rounded-r-sm border border-[#4b5563]/30"></div>
                                        <div className="w-5 h-1.5 bg-gradient-to-r from-[#9ca3af] via-[#f3f4f6] to-[#6b7280] shadow-[2px_2px_3px_rgba(0,0,0,0.4)] rounded-r-sm border border-[#4b5563]/30"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Elastic Band */}
                            <div className="absolute right-4 top-0 bottom-0 w-3 bg-[#1a1e26] shadow-[inset_1px_0_2px_rgba(255,255,255,0.2),-2px_0_5px_rgba(0,0,0,0.5)] z-40">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/woven-light.png')] opacity-30 mix-blend-overlay"></div>
                            </div>

                            {/* Cover Image */}
                            {coverUrl && (
                                <div className="absolute inset-0 z-0">
                                    <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover opacity-60 mix-blend-multiply" />
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
                                </div>
                            )}

                            {/* Title Plate */}
                            <div className={`absolute top-12 left-1/2 -translate-x-1/2 ${selectedColor === '#1a1e26' || selectedColor === '#3a4a3a' ? 'bg-white text-ink' : 'bg-white/95 text-ink'} px-4 py-3 shadow-sm border border-black/5 rotate-1 min-w-[140px] max-w-[90%] text-center z-20`}>
                                <h3 className="font-serif text-lg font-semibold truncate">{projectTitle || "Votre Titre"}</h3>
                                <p className="text-[8px] text-ink-light mt-1 font-mono uppercase tracking-widest opacity-60">Prévisualisation</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
