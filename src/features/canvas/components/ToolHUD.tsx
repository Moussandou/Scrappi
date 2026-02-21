"use client";

import { CanvasElement } from "@/domain/entities";

interface ToolHUDProps {
    activeTool: 'select' | 'draw' | 'arrow' | 'eraser' | 'hand';
    elements: CanvasElement[];
    selectedIds: string[];
    activeColor: string;
    activeStrokeWidth: number;
    handleColorSelect: (color: string) => void;
    handleStrokeWidthChange: (width: number) => void;
}

const COLORS = [
    { name: 'Ink', value: '#1a1e26' },
    { name: 'Sage', value: '#8a9a86' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Pink', value: '#ec4899' },
];

export default function ToolHUD({
    activeTool,
    elements,
    selectedIds,
    activeColor,
    activeStrokeWidth,
    handleColorSelect,
    handleStrokeWidthChange
}: ToolHUDProps) {
    const selectedElements = elements.filter(el => selectedIds.includes(el.id));
    const hasPostIt = selectedElements.some(el => el.type === 'text' && !!el.backgroundColor);
    const hasText = selectedElements.some(el => el.type === 'text' && !el.backgroundColor);
    const hasLines = selectedElements.some(el => el.type === 'line' || el.type === 'arrow');
    const hasEraser = selectedElements.some(el => el.type === 'eraser');
    const isDrawingTool = activeTool === 'draw' || activeTool === 'arrow' || activeTool === 'eraser';

    const showHUD = isDrawingTool || selectedIds.length > 0;
    if (!showHUD) return null;

    const showColor = (activeTool !== 'eraser' && !hasEraser) && (isDrawingTool || hasPostIt || hasText || hasLines);
    const showThickness = isDrawingTool || hasLines || hasEraser;

    if (!showColor && !showThickness) return null;

    let colorLabel = "Couleur";
    if (hasPostIt && !hasText && !hasLines && activeTool === 'select') colorLabel = "Couleur Papier";
    else if (hasText && !hasPostIt && !hasLines && activeTool === 'select') colorLabel = "Couleur Encre";

    return (
        <div className="flex flex-col gap-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-black/5 shadow-xl animate-in fade-in slide-in-from-left-4 duration-200 pointer-events-auto w-28 h-fit">
            {showColor && (
                <>
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider mb-1">{colorLabel}</p>
                        <div className="grid grid-cols-3 gap-2">
                            {COLORS.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => handleColorSelect(color.value)}
                                    className={`size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 ${activeColor === color.value ? 'border-ink scale-110 shadow-md' : 'border-transparent'}`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                            <div
                                className={`relative size-6 flex-shrink-0 rounded-full border-2 transition-transform hover:scale-110 overflow-hidden flex items-center justify-center ${!COLORS.some(c => c.value === activeColor) ? 'border-ink scale-110 shadow-md' : 'border-transparent'}`}
                                style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                                title="Couleur personnalisée"
                            >
                                <input
                                    type="color"
                                    value={activeColor}
                                    onChange={(e) => handleColorSelect(e.target.value)}
                                    className="absolute inset-[-10px] w-12 h-12 cursor-pointer opacity-0"
                                />
                            </div>
                        </div>
                    </div>
                    {showThickness && <div className="h-px w-full bg-ink/5 my-1" />}
                </>
            )}

            {showThickness && (
                <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider mb-1">
                        {activeTool === 'eraser' || (selectedIds.length > 0 && selectedElements.every(el => el.type === 'eraser')) ? 'Taille gomme' : 'Épaisseur'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {[2, 4, 8, 16].map((w) => (
                            <button
                                key={w}
                                onClick={() => handleStrokeWidthChange(w)}
                                className={`size-10 rounded-xl flex items-center justify-center transition-all ${activeStrokeWidth === w ? 'bg-sage text-white shadow-sm' : 'text-ink-light hover:bg-black/5'}`}
                            >
                                <div
                                    className="rounded-full bg-current transition-all"
                                    style={{
                                        width: w,
                                        height: w
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
