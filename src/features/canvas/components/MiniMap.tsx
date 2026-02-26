"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

const MINIMAP_SIZE = 150; // Max width or height of the minimap
const PADDING = 100; // Padding around the edges

const EMPTY_ARRAY: any[] = [];
const DEFAULT_POSITION = { x: 0, y: 0 };

export default function MiniMap() {
    const elements = useCanvasStore(state => state?.elements) || EMPTY_ARRAY;
    const scale = useCanvasStore(state => state?.scale) ?? 1;
    const position = useCanvasStore(state => state?.position) || DEFAULT_POSITION;
    const setPosition = useCanvasStore(state => state?.setPosition) || (() => { });

    const [viewport, setViewport] = useState({ w: 0, h: 0 });
    const minimapRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const updateSize = () => {
            setViewport({ w: window.innerWidth, h: window.innerHeight });
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Calculate the total area encompassing all elements AND the current viewport
    const worldBounds = useMemo(() => {
        // Viewport current bounds in logical canvas coordinates
        const vMinX = -position.x / scale;
        const vMinY = -position.y / scale;
        const vMaxX = vMinX + (viewport.w / scale);
        const vMaxY = vMinY + (viewport.h / scale);

        let minX = vMinX;
        let minY = vMinY;
        let maxX = vMaxX;
        let maxY = vMaxY;

        elements.forEach(el => {
            let ex1 = el.x || 0;
            let ey1 = el.y || 0;
            let ex2 = (el.x || 0) + (el.width || 0);
            let ey2 = (el.y || 0) + (el.height || 0);

            if (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser') {
                if (el.points && el.points.length > 0) {
                    const xs = el.points.filter((_, i) => i % 2 === 0);
                    const ys = el.points.filter((_, i) => i % 2 === 1);
                    ex1 = el.x + Math.min(...xs);
                    ey1 = el.y + Math.min(...ys);
                    ex2 = el.x + Math.max(...xs);
                    ey2 = el.y + Math.max(...ys);
                }
            }

            if (!isNaN(ex1) && ex1 < minX) minX = ex1;
            if (!isNaN(ey1) && ey1 < minY) minY = ey1;
            if (!isNaN(ex2) && ex2 > maxX) maxX = ex2;
            if (!isNaN(ey2) && ey2 > maxY) maxY = ey2;
        });

        // Add padding
        minX -= PADDING;
        minY -= PADDING;
        maxX += PADDING;
        maxY += PADDING;

        const w = Math.max(maxX - minX, 1);
        const h = Math.max(maxY - minY, 1);

        return { minX, minY, w, h };
    }, [elements, position, scale, viewport]);

    // Calculate map scaling
    const mapScale = Math.min(MINIMAP_SIZE / (worldBounds.w || 1), MINIMAP_SIZE / (worldBounds.h || 1));
    const mapW = isNaN(worldBounds.w * mapScale) ? MINIMAP_SIZE : worldBounds.w * mapScale;
    const mapH = isNaN(worldBounds.h * mapScale) ? MINIMAP_SIZE : worldBounds.h * mapScale;

    // Viewport rect in minimap
    const viewX = ((-position.x / scale) - worldBounds.minX) * mapScale;
    const viewY = ((-position.y / scale) - worldBounds.minY) * mapScale;
    const viewW = (viewport.w / scale) * mapScale;
    const viewH = (viewport.h / scale) * mapScale;

    const moveViewportToEvent = useCallback((e: React.PointerEvent | PointerEvent) => {
        if (!minimapRef.current) return;
        const rect = minimapRef.current.getBoundingClientRect();

        // Mouse position inside minimap
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Convert minimap mouse position to logical center point for viewport
        const logicalCx = (mx / mapScale) + worldBounds.minX;
        const logicalCy = (my / mapScale) + worldBounds.minY;

        // Calculate new position so that logicalC is at the center of the viewport
        const newPosX = -(logicalCx * scale) + (viewport.w / 2);
        const newPosY = -(logicalCy * scale) + (viewport.h / 2);

        setPosition({ x: newPosX, y: newPosY });
    }, [mapScale, worldBounds, scale, viewport, setPosition]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        moveViewportToEvent(e);
    };

    const handlePointerMove = useCallback((e: PointerEvent) => {
        if (!isDragging) return;
        moveViewportToEvent(e);
    }, [isDragging, moveViewportToEvent]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove);
            window.addEventListener('pointerup', handlePointerUp);
        } else {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, handlePointerMove, handlePointerUp]);

    // If nothing has rendered yet
    if (viewport.w === 0) return null;

    return (
        <div
            className="fixed bottom-24 left-10 md:bottom-8 md:left-28 z-[100] bg-white backdrop-blur-md rounded-2xl border-2 border-sage shadow-xl p-2 origin-bottom-left transition-all hover:bg-white overflow-hidden pointer-events-auto"
            style={{ width: (mapW || MINIMAP_SIZE) + 16, height: (mapH || MINIMAP_SIZE) + 16, display: 'block' }}
        >
            <div
                ref={minimapRef}
                className="relative w-full h-full cursor-crosshair group"
                onPointerDown={handlePointerDown}
            >
                {/* Background world representation */}
                <div className="absolute inset-0 bg-black/5 rounded-lg overflow-hidden">
                    {/* Elements abstract representation */}
                    {elements.map(el => {
                        let ex = el.x;
                        let ey = el.y;
                        let ew = el.width || 10;
                        let eh = el.height || 10;
                        let color = 'bg-ink/20';

                        if (el.type === 'image' || el.type === 'video') color = 'bg-sage/40';
                        if (el.type === 'text') color = 'bg-blue-500/20';
                        if (el.type === 'sticker') color = 'bg-yellow-500/40';

                        if (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser') {
                            if (el.points && el.points.length > 0) {
                                const xs = el.points.filter((_, i) => i % 2 === 0);
                                const ys = el.points.filter((_, i) => i % 2 === 1);
                                ex = el.x + Math.min(...xs);
                                ey = el.y + Math.min(...ys);
                                ew = Math.max(...xs) - Math.min(...xs);
                                eh = Math.max(...ys) - Math.min(...ys);
                            }
                            color = 'bg-ink/40';
                        }

                        const left = (ex - worldBounds.minX) * mapScale;
                        const top = (ey - worldBounds.minY) * mapScale;
                        const width = Math.max(ew * mapScale, 1); // at least 1px
                        const height = Math.max(eh * mapScale, 1); // at least 1px

                        return (
                            <div
                                key={el.id}
                                className={`absolute rounded-sm ${color}`}
                                style={{
                                    left,
                                    top,
                                    width,
                                    height,
                                    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined
                                }}
                            />
                        );
                    })}
                </div>

                {/* Viewport rectangle */}
                <div
                    className="absolute border-2 border-sage/80 bg-sage/10 rounded-md pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.05)] transition-all duration-75 group-hover:border-sage group-hover:bg-sage/20"
                    style={{
                        left: viewX,
                        top: viewY,
                        width: viewW,
                        height: viewH
                    }}
                />
            </div>

            <div className="absolute bottom-1 right-2 text-[8px] font-bold uppercase tracking-widest text-ink/30 pointer-events-none">
                {Math.round(scale * 100)}%
            </div>
        </div>
    );
}
