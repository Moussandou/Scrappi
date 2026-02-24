import React, { useEffect, useState } from 'react';
import { CanvasElement } from '@/domain/entities';
import { getElements } from '@/infra/db/firestoreService';

interface MiniCanvasPreviewProps {
    scrapbookId: string;
    isActive: boolean;
}

export const MiniCanvasPreview: React.FC<MiniCanvasPreviewProps> = ({ scrapbookId, isActive }) => {
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        if (isActive && scrapbookId && elements.length === 0 && !loading) {
            const loadData = async () => {
                setLoading(true);
                try {
                    const fetchedElems = await getElements(scrapbookId);
                    if (mounted) {
                        setElements(fetchedElems);
                        setLoading(false);
                    }
                } catch (err) {
                    console.error(`[MiniCanvasPreview] Error fetching elements:`, err);
                    if (mounted) setLoading(false);
                }
            };
            loadData();
        }
        return () => {
            mounted = false;
        };
    }, [isActive, scrapbookId, elements.length, loading]); // Removed getElements

    const getBoundingBox = (elements: CanvasElement[]) => {
        if (elements.length === 0) return { minX: 0, minY: 0, width: 1920, height: 1080 };

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        elements.forEach(el => {
            if (el.type === 'line' && el.points && el.points.length > 0) {
                for (let i = 0; i < el.points.length; i += 2) {
                    const x = el.points[i];
                    const y = el.points[i + 1];
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            } else {
                minX = Math.min(minX, el.x || 0);
                minY = Math.min(minY, el.y || 0);
                maxX = Math.max(maxX, (el.x || 0) + (el.width || 0));
                maxY = Math.max(maxY, (el.y || 0) + (el.height || 0));
            }
        });

        // Add padding proportionally
        const paddingX = Math.max(100, (maxX - minX) * 0.1);
        const paddingY = Math.max(100, (maxY - minY) * 0.1);
        minX -= paddingX;
        minY -= paddingY;
        maxX += paddingX;
        maxY += paddingY;

        let width = Math.max(100, maxX - minX);
        let height = Math.max(100, maxY - minY);

        // Ensure aspect ratio doesn't get wildly distorted
        const aspect = width / height;
        if (aspect > 3) { height = width / 3; }
        if (aspect < 0.3) { width = height * 0.3; }

        return { minX, minY, width, height };
    };

    const bbox = getBoundingBox(elements);

    return (
        <div className="relative w-full h-full bg-paper overflow-hidden flex items-center justify-center p-2 rounded-md">
            {loading ? (
                <div className="flex flex-col items-center text-sage/60">
                    <span className="material-symbols-outlined transition-transform duration-1000 rotate-180 animate-spin text-2xl mb-1">refresh</span>
                    <span className="text-[6px] tracking-widest uppercase font-bold">Chargement...</span>
                </div>
            ) : elements.length === 0 ? (
                <div className="flex flex-col items-center text-ink-light/40">
                    <span className="material-symbols-outlined text-3xl mb-1">draft</span>
                    <span className="text-[8px] font-bold uppercase tracking-widest">Classeur vide</span>
                </div>
            ) : (
                <div
                    className="relative w-full h-full"
                    style={{
                        // Scale content to fit the container naturally
                        containerType: 'size',
                    }}
                >
                    <svg
                        viewBox={`${bbox.minX} ${bbox.minY} ${bbox.width} ${bbox.height}`}
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {elements.map((el) => {
                            if (el.type === 'line' && el.points && el.points.length > 0) {
                                // Generate SVG path for line. Points are stored as [x1, y1, x2, y2, ...]
                                let pathData = '';
                                for (let i = 0; i < el.points.length; i += 2) {
                                    const x = el.points[i];
                                    const y = el.points[i + 1];
                                    if (i === 0) pathData += `M ${x} ${y}`;
                                    else pathData += ` L ${x} ${y}`;
                                }

                                // Ensure valid stroke color and a thick enough stroke
                                const stroke = el.strokeColor && el.strokeColor.startsWith('#') ? el.strokeColor : '#2c3e50';
                                // Dynamic thickness relative to the bounding box, to emulate the look from far away
                                const thickness = Math.max((el.strokeWidth || 5) * 2, bbox.width * 0.005);

                                return (
                                    <path
                                        key={el.id}
                                        d={pathData}
                                        stroke={stroke}
                                        strokeWidth={thickness}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                );
                            } else if (el.type === 'text' || el.type === 'sticker') {
                                // Represent text/stickers as rectangles block
                                return (
                                    <rect
                                        key={el.id}
                                        x={el.x}
                                        y={el.y}
                                        width={Math.max(el.width, 100)}
                                        height={Math.max(el.height, 50)}
                                        fill={el.backgroundColor || '#fbbf24'}
                                        rx={8}
                                        opacity={0.9}
                                        transform={`rotate(${el.rotation || 0} ${el.x + el.width / 2} ${el.y + el.height / 2})`}
                                    />
                                );
                            } else if (el.type === 'image') {
                                return (
                                    <rect
                                        key={el.id}
                                        x={el.x}
                                        y={el.y}
                                        width={el.width}
                                        height={el.height}
                                        fill="#e2e8f0"
                                        stroke="#cbd5e1"
                                        strokeWidth="4"
                                        rx={4}
                                        transform={`rotate(${el.rotation || 0} ${el.x + el.width / 2} ${el.y + el.height / 2})`}
                                    />
                                );
                            }
                            return null;
                        })}
                    </svg>
                </div>
            )}
        </div>
    );
};
