"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Scrapbook } from '@/domain/entities';
import { useAuth } from '@/infra/auth/authContext';
import { uploadImage } from '@/infra/db/storageService';
import { BookBinder } from '@/ui/components/BookBinder';
import { BINDER_COLORS } from '@/ui/constants';

export interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: { title: string; binderColor: string; coverImage?: string | null; binderGrain?: number; coverZoom?: number; coverX?: number; coverY?: number; showPreview?: boolean }) => void;
    initialData?: Scrapbook;
    title: string;
    error?: string | null;
}

export default function ProjectModal({ isOpen, onClose, onConfirm, initialData, title, error: externalError }: ProjectModalProps) {
    const [projectTitle, setProjectTitle] = useState(initialData?.title || "");
    const [selectedColor, setSelectedColor] = useState(initialData?.binderColor || BINDER_COLORS[0].value);
    const [binderGrain, setBinderGrain] = useState(initialData?.binderGrain ?? 0.1);
    const [coverUrl, setCoverUrl] = useState(initialData?.coverImage || "");
    const [coverZoom, setCoverZoom] = useState(initialData?.coverZoom ?? 1);
    const [coverX, setCoverX] = useState(initialData?.coverX ?? 50);
    const [coverY, setCoverY] = useState(initialData?.coverY ?? 50);
    const [showPreview, setShowPreview] = useState(initialData?.showPreview ?? true);
    const [uploading, setUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const actualError = externalError || errorMessage;
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0, coverX: 50, coverY: 50 });
    const containerRef = useRef<HTMLDivElement>(null);
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
            setShowPreview(initialData?.showPreview ?? true);
            setErrorMessage(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setErrorMessage(null);
        try {
            const url = await uploadImage(file, "covers");
            setCoverUrl(url);
            setCoverX(50);
            setCoverY(50);
            setCoverZoom(1);
        } catch (error) {
            console.error("Upload failed", error);
            setErrorMessage("Impossible d'importer l'image. Vérifiez votre connexion.");
        } finally {
            setUploading(false);
        }
    };

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!coverUrl) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        dragStartPos.current = { x: clientX, y: clientY, coverX, coverY };
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;
        e.preventDefault();

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - dragStartPos.current.x;
        const deltaY = clientY - dragStartPos.current.y;

        const { width, height } = containerRef.current.getBoundingClientRect();

        const newX = dragStartPos.current.coverX + (deltaX / width * 100);
        const newY = dragStartPos.current.coverY + (deltaY / height * 100);

        setCoverX(Math.max(0, Math.min(100, newX)));
        setCoverY(Math.max(0, Math.min(100, newY)));
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleConfirm = () => {
        setErrorMessage(null);
        if (!projectTitle.trim()) {
            setErrorMessage("Votre classeur a besoin d'un petit nom !");
            return;
        }
        onConfirm({
            title: projectTitle,
            binderColor: selectedColor,
            binderGrain: binderGrain,
            coverImage: coverUrl || null,
            coverZoom: coverZoom,
            coverX: coverX,
            coverY: coverY,
            showPreview: showPreview
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-12 overflow-hidden bg-black/5 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.1)_100%)]">
            <div className="absolute inset-0 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose} />

            <div className="relative w-full max-w-5xl h-full max-h-[850px] flex flex-col md:flex-row bg-paper rounded-[40px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden border border-paper-dark animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">
                <div className="paper-grain opacity-60"></div>

                {/* Left Side: Creation Space */}
                <div className="p-10 relative z-10 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="font-serif text-4xl font-bold text-ink mb-2">{title}</h2>
                            <p className="text-sm text-ink-light/60 font-serif italic">Personnalisez votre espace de création</p>
                        </div>
                        <button onClick={onClose} className="size-12 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors group">
                            <span className="material-symbols-outlined text-[24px] group-hover:rotate-90 transition-transform duration-300">close</span>
                        </button>
                    </div>

                    {actualError && (
                        <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="material-symbols-outlined text-orange-500">error</span>
                            <span className="text-sm font-bold text-orange-800">{actualError}</span>
                        </div>
                    )}

                    <div className="space-y-10 flex-1">
                        {/* Title Input */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-ink-light uppercase tracking-[0.2em] ml-1">Nom du classeur</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={projectTitle}
                                    onChange={(e) => {
                                        setProjectTitle(e.target.value);
                                        if (errorMessage) setErrorMessage(null);
                                    }}
                                    placeholder="Libellé de votre projet..."
                                    className="w-full bg-white/50 border border-black/5 rounded-2xl py-5 px-6 outline-none focus:bg-white focus:border-sage/40 focus:ring-4 focus:ring-sage/5 transition-all text-2xl font-serif italic text-ink shadow-inner whitespace-nowrap overflow-hidden text-ellipsis"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-ink/10 group-focus-within:text-sage/40 transition-colors">edit</span>
                            </div>
                        </div>

                        {/* Color Selection */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-ink-light uppercase tracking-[0.2em] ml-1">Matériau & Couleur</label>
                            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-4">
                                {BINDER_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => setSelectedColor(color.value)}
                                        className={`size-14 rounded-2xl transition-all relative border-2 ${selectedColor === color.value ? 'border-sage scale-110 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] active:scale-100' : 'border-black/5 hover:border-black/10 hover:scale-105'}`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    >
                                        {selectedColor === color.value && (
                                            <div className="absolute -top-2 -right-2 bg-sage text-white rounded-full size-6 flex items-center justify-center shadow-lg border-2 border-white scale-110 animate-in zoom-in duration-200">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                                {/* Custom Color Picker */}
                                <div className={`relative size-14 rounded-2xl transition-all border-2 flex items-center justify-center overflow-hidden cursor-pointer ${!BINDER_COLORS.some(c => c.value === selectedColor) ? 'border-sage scale-110 shadow-lg' : 'border-black/5 hover:border-black/10 hover:scale-105'}`} title="Teinte sur mesure">
                                    <input
                                        type="color"
                                        value={selectedColor}
                                        onChange={(e) => setSelectedColor(e.target.value)}
                                        className="absolute inset-[-10px] w-[80px] h-[80px] cursor-pointer opacity-0"
                                    />
                                    <span className="material-symbols-outlined text-ink/20 pointer-events-none z-10 text-[24px]">palette</span>
                                    {!BINDER_COLORS.some(c => c.value === selectedColor) && (
                                        <div className="absolute -top-2 -right-2 bg-sage text-white rounded-full size-6 flex items-center justify-center shadow-lg border-2 border-white scale-110">
                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {/* Grain Selection */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-[11px] font-bold text-ink-light uppercase tracking-[0.2em]">Usure & Grain</label>
                                    <span className="text-[10px] bg-sage/10 text-sage px-2 py-0.5 rounded-full font-bold">{Math.round(binderGrain * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={binderGrain}
                                    onChange={(e) => setBinderGrain(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-paper-dark rounded-lg appearance-none cursor-pointer accent-sage"
                                />
                            </div>

                            {/* View Option */}
                            <div className="space-y-4">
                                <label className="text-[11px] font-bold text-ink-light uppercase tracking-[0.2em] ml-1">Transparence</label>
                                <div className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${showPreview ? 'bg-sage/5 border-sage/20' : 'bg-white/50 border-black/5'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 rounded-xl flex items-center justify-center transition-colors ${showPreview ? 'bg-sage/10 text-sage' : 'bg-black/5 text-ink/20'}`}>
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPreview ? 'visibility' : 'visibility_off'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-bold text-ink">Aperçu du contenu</span>
                                            <span className="text-[10px] text-ink-light/60 font-serif italic">Entrevoir vos pages à travers la couverture</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${showPreview ? 'bg-sage' : 'bg-ink/10'} shadow-inner`}
                                    >
                                        <div className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform duration-200 shadow-sm ${showPreview ? 'translate-x-[18px]' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Cover Image */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-bold text-ink-light uppercase tracking-[0.2em] ml-1">Image de Couverture</label>
                            <div className="flex flex-col sm:flex-row gap-8 items-start">
                                <div
                                    ref={containerRef}
                                    onMouseDown={handleDragStart}
                                    onMouseMove={handleDragMove}
                                    onMouseUp={handleDragEnd}
                                    onMouseLeave={handleDragEnd}
                                    onTouchStart={handleDragStart}
                                    onTouchMove={handleDragMove}
                                    onTouchEnd={handleDragEnd}
                                    onClick={() => !coverUrl && fileInputRef.current?.click()}
                                    className={`relative aspect-[3/4] w-full max-w-[200px] rounded-2xl border-2 border-dashed border-black/5 bg-white/50 hover:bg-white transition-all cursor-${isDragging ? 'grabbing' : coverUrl ? 'grab' : 'pointer'} overflow-hidden flex flex-col items-center justify-center group select-none shadow-sm`}
                                >
                                    {coverUrl ? (
                                        <>
                                            <div
                                                className="absolute shadow-xl border border-black/10 bg-white p-0.5 transition-all duration-100"
                                                style={{
                                                    left: `${coverX}%`,
                                                    top: `${coverY}%`,
                                                    width: `${coverZoom * 80}%`,
                                                    transform: 'translate(-50%, -50%) rotate(-1deg)',
                                                }}
                                            >
                                                <img
                                                    src={coverUrl}
                                                    alt="Cover preview"
                                                    className="w-full h-auto block pointer-events-none rounded-[1px]"
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white pointer-events-none">
                                                <span className="material-symbols-outlined text-4xl drop-shadow-md">drag_pan</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            className="w-full h-full flex flex-col items-center justify-center px-4 text-center"
                                        >
                                            <div className="size-16 rounded-full bg-sage/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-3xl text-sage/40">
                                                    {uploading ? "sync" : "photo_library"}
                                                </span>
                                            </div>
                                            <span className="text-xs text-ink-light font-bold">
                                                {uploading ? "Traitement..." : "Glissez une image ou cliquez ici"}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 w-full space-y-6">
                                    <div className="flex flex-wrap gap-2">
                                        {coverUrl && (
                                            <>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2.5 rounded-xl bg-white border border-black/5 text-xs font-bold text-ink hover:bg-sage hover:text-white hover:border-sage transition-all flex items-center gap-2 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">upload</span>
                                                    Changer l'image
                                                </button>
                                                <button
                                                    onClick={() => setCoverUrl("")}
                                                    className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all flex items-center gap-2 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    Supprimer
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {coverUrl && (
                                        <div className="space-y-3 bg-white/50 p-4 rounded-2xl border border-black/5">
                                            <div className="flex justify-between text-[10px] text-ink-light font-bold uppercase tracking-wider">
                                                <span>Zoom de l&apos;image</span>
                                                <span>{Math.round(coverZoom * 100)}%</span>
                                            </div>
                                            <input
                                                type="range" min="0.1" max="2" step="0.05"
                                                value={coverZoom}
                                                onChange={(e) => setCoverZoom(parseFloat(e.target.value))}
                                                className="w-full h-1 bg-paper-dark rounded-lg appearance-none cursor-pointer accent-sage"
                                            />
                                            <p className="text-[10px] text-ink-light/40 italic">Astuce : Déplacez l&apos;image à gauche pour l&apos;ajuster.</p>
                                        </div>
                                    )}
                                </div>
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

                    <div className="mt-auto pt-10 flex gap-4 shrink-0">
                        <button
                            onClick={onClose}
                            className="flex-1 py-5 rounded-[20px] font-bold text-ink-light hover:bg-black/5 transition-all uppercase tracking-[0.2em] text-[10px]"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={uploading}
                            className="flex-[2] py-5 rounded-[20px] bg-ink text-white font-bold shadow-xl hover:bg-sage hover:shadow-sage/20 transition-all uppercase tracking-[0.2em] text-[10px] disabled:opacity-50 group flex items-center justify-center gap-2"
                        >
                            Lancer la Création
                            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </div>
                </div>

                {/* Right Side: Immersive Preview */}
                <div className="relative z-10 hidden md:flex w-[400px] bg-paper-dark/40 border-l border-paper-dark/30 flex-col items-center justify-center p-12 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white opacity-20 blur-[120px] rounded-full" />
                    </div>

                    <div className="relative w-full max-w-[280px] z-10">
                        <div className="text-center mb-12">
                            <p className="text-[11px] font-bold text-ink-light/40 uppercase tracking-[0.3em]">Signature Digitale</p>
                            <div className="h-px w-12 bg-sage/20 mx-auto mt-2" />
                        </div>

                        <div className="relative w-full aspect-[3/4] mx-auto perspective-[2500px] rotate-[-2deg] hover:rotate-0 transition-transform duration-700 ease-out">
                            <div className="absolute inset-0 bg-black/5 blur-2xl translate-y-8 translate-x-4 rounded-[1px] opacity-40 shadow-2xl" />
                            <BookBinder
                                scrapbook={{
                                    title: projectTitle || "Mon Projet",
                                    binderColor: selectedColor,
                                    binderGrain: binderGrain,
                                    coverImage: coverUrl || undefined,
                                    coverZoom: coverZoom,
                                    coverX: coverX,
                                    coverY: coverY,
                                    showPreview: showPreview
                                }}
                                showDetails={true}
                                interactive={false}
                                className="pointer-events-none drop-shadow-[0_25px_50px_rgba(0,0,0,0.15)]"
                            />
                        </div>

                        <div className="mt-16 text-center space-y-2">
                            <p className="font-handwriting text-2xl text-sage/60 rotate-[-4deg]">Prêt pour l&apos;aventure ?</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
