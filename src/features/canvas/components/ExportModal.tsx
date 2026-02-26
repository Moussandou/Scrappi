"use client";

import { useState } from "react";

export type ExportFormat = "png" | "jpeg" | "webp";
export type ExportQuality = 0.5 | 0.8 | 1.0;
export type ExportResolution = 1 | 2 | 3;

export interface ExportOptions {
    format: ExportFormat;
    quality: ExportQuality;
    resolution: ExportResolution;
    transparentBackground: boolean;
}

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => void;
    isExporting: boolean;
}

export default function ExportModal({ isOpen, onClose, onExport, isExporting }: ExportModalProps) {
    const [format, setFormat] = useState<ExportFormat>("png");
    const [quality, setQuality] = useState<ExportQuality>(0.8);
    const [resolution, setResolution] = useState<ExportResolution>(2);
    const [transparentBackground, setTransparentBackground] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleExportClick = () => {
        onExport({
            format,
            quality: format === "png" ? 1.0 : quality,
            resolution,
            transparentBackground: format === "jpeg" ? false : transparentBackground, // JPEG doesn't support transparency
        });
    };

    return (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-black/5 shadow-2xl rounded-3xl w-full max-w-sm overflow-hidden flex flex-col pointer-events-auto">
                {/* Header */}
                <div className="p-4 md:p-6 pb-2 md:pb-4 flex justify-between items-center border-b border-black/5">
                    <div>
                        <h2 className="text-xl md:text-2xl font-serif text-ink italic tracking-tight">Paramètres d'export</h2>
                        <p className="text-xs text-ink-light mt-1">Configurez la qualité de votre image</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-ink-light hover:text-ink transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 md:p-6 flex flex-col gap-5">
                    {/* Format */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-widest text-ink-light font-bold">Format</label>
                        <div className="flex bg-black/5 rounded-xl p-1">
                            {(["png", "jpeg", "webp"] as ExportFormat[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => {
                                        setFormat(f);
                                        if (f === "jpeg") setTransparentBackground(false);
                                    }}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${format === f ? 'bg-white text-ink shadow-sm' : 'text-ink-light hover:text-ink'}`}
                                >
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Resolution */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase tracking-widest text-ink-light font-bold">Résolution (Zoom)</label>
                        <div className="flex bg-black/5 rounded-xl p-1">
                            <button onClick={() => setResolution(1)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${resolution === 1 ? 'bg-white text-sage shadow-sm' : 'text-ink-light hover:text-ink'}`}>Standard</button>
                            <button onClick={() => setResolution(2)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${resolution === 2 ? 'bg-white text-sage shadow-sm' : 'text-ink-light hover:text-ink'}`}>HD (2x)</button>
                            <button onClick={() => setResolution(3)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${resolution === 3 ? 'bg-white text-sage shadow-sm' : 'text-ink-light hover:text-ink'}`}>Ultra (3x)</button>
                        </div>
                    </div>

                    {/* Quality (Only for JPEG/WebP) */}
                    <div className={`flex flex-col gap-2 transition-opacity duration-300 ${format === 'png' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <label className="text-xs uppercase tracking-widest text-ink-light font-bold">Qualité de compression</label>
                        <div className="flex bg-black/5 rounded-xl p-1">
                            <button onClick={() => setQuality(0.5)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${quality === 0.5 ? 'bg-white text-sage shadow-sm' : 'text-ink-light hover:text-ink'}`}>Basse</button>
                            <button onClick={() => setQuality(0.8)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${quality === 0.8 ? 'bg-white text-sage shadow-sm' : 'text-ink-light hover:text-ink'}`}>Moyenne</button>
                            <button onClick={() => setQuality(1.0)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${quality === 1.0 ? 'bg-white text-sage shadow-sm' : 'text-ink-light hover:text-ink'}`}>Haute</button>
                        </div>
                    </div>

                    {/* Background */}
                    <div className={`flex items-center justify-between p-3 bg-paper rounded-xl border border-black/5 transition-opacity duration-300 ${format === 'jpeg' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-ink">Fond transparent</span>
                            <span className="text-[10px] text-ink-light">Ignore la couleur du papier</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={transparentBackground}
                                onChange={(e) => setTransparentBackground(e.target.checked)}
                                disabled={format === 'jpeg'}
                            />
                            <div className="w-9 h-5 bg-black/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sage"></div>
                        </label>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 pt-2 bg-black/5 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-ink hover:bg-black/5 transition-colors"
                        disabled={isExporting}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleExportClick}
                        disabled={isExporting}
                        className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-sage hover:bg-sage/90 shadow-md shadow-sage/20 transition-all flex items-center justify-center gap-2 min-w-[120px]"
                    >
                        {isExporting ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                        )}
                        Exporter
                    </button>
                </div>
            </div>
        </div>
    );
}
