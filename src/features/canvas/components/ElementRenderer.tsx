"use client";

import { useRef, useEffect, useState, useCallback, memo } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Text, Image as KonvaImage, Group, Rect, Line, Arrow, Path } from "react-konva";
import { Html } from "react-konva-utils";
import { getStroke } from 'perfect-freehand';
import useImage from "use-image";
import { CanvasElement } from "@/domain/entities";
import { loadFont } from "@/infra/fonts/googleFontsService";
import { isLocalRef, resolveLocalUrl } from "@/infra/storage/localStorageService";
import { DEFAULT_FONT, SELECTION_STROKE_COLOR, DEFAULT_STROKE_COLOR } from "../constants";

interface ElementProps {
    element: CanvasElement;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onChange: (id: string, newProps: Partial<CanvasElement>) => void;
    isDraggable: boolean;
    onNodeRegister?: (id: string, node: Konva.Node) => void;
    onDragStart?: (id: string, e: KonvaEventObject<DragEvent>) => void;
    onDragMove?: (id: string, e: KonvaEventObject<DragEvent>) => void;
}

export const RenderElement = memo(function RenderElement({
    element,
    isSelected,
    onSelect,
    onChange,
    isDraggable,
    onNodeRegister,
    onDragStart,
    onDragMove
}: ElementProps) {
    const shapeRef = useRef<Konva.Group | Konva.Shape | Konva.Line | Konva.Arrow | Konva.Image | null>(null);
    const isImageType = element.type === 'image' || element.type === 'sticker';
    const [resolvedSrc, setResolvedSrc] = useState(isImageType && !isLocalRef(element.content) ? element.content : '');
    const [img] = useImage(resolvedSrc, resolvedSrc ? 'anonymous' : undefined);
    const [isEditing, setIsEditing] = useState(false);

    const getSvgPathFromStroke = useCallback((stroke: number[][]) => {
        if (!stroke.length) return '';
        const d = stroke.reduce(
            (acc, [x0, y0], i, arr) => {
                const [x1, y1] = arr[(i + 1) % arr.length];
                acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
                return acc;
            },
            ['M', ...stroke[0], 'Q']
        );
        d.push('Z');
        return d.join(' ');
    }, []);

    // Resolve local: URLs to blob URLs for image types
    useEffect(() => {
        if (!isImageType) return;
        let aborted = false;

        const load = async () => {
            if (isLocalRef(element.content)) {
                try {
                    const url = await resolveLocalUrl(element.content);
                    if (!aborted) setResolvedSrc(url);
                } catch {
                    if (!aborted) setResolvedSrc('');
                }
            } else {
                if (!aborted) setResolvedSrc(element.content);
            }
        };

        load();
        return () => { aborted = true; };
    }, [element.content, isImageType]);

    // Register node for Transformer
    useEffect(() => {
        if (shapeRef.current && onNodeRegister) {
            onNodeRegister(element.id, shapeRef.current);
        }
    }, [onNodeRegister, element.id]);

    const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
        if (onDragStart) onDragStart(element.id, e);
    };

    const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
        onChange(element.id, {
            x: e.target.x(),
            y: e.target.y()
        });
    };

    const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
        if (onDragMove) {
            onDragMove(element.id, e);
        }
    };

    const handleTransformEnd = () => {
        console.log("RenderElement: handleTransformEnd fired for", element.id);
        const node = shapeRef.current;
        if (!node) return;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onChange(element.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation()
        });
    };

    const handleDoubleClick = useCallback(() => {
        if (element.type === 'text') {
            setIsEditing(true);
        }
    }, [element.type, element.isLocked]);

    const fontFamily = element.fontFamily || DEFAULT_FONT;

    // Load custom font on mount
    useEffect(() => {
        if (element.fontFamily) {
            loadFont(element.fontFamily);
        }
    }, [element.fontFamily]);

    return (
        <Group>
            {element.type === 'text' && (
                <Group
                    ref={(node) => { shapeRef.current = node; }}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height || 50}
                    rotation={element.rotation}
                    draggable={isDraggable && !element.isLocked}
                    onClick={() => { if (!element.isLocked) onSelect(element.id); }}
                    onTap={() => { if (!element.isLocked) onSelect(element.id); }}
                    onDblClick={handleDoubleClick}
                    onDblTap={handleDoubleClick}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragMove={handleDragMove}
                    onTransformEnd={handleTransformEnd}
                    listening={!element.isLocked}
                >
                    {/* Hit area: makes the entire bounding box grabbable */}
                    <Rect
                        width={element.width}
                        height={element.height || 50}
                        fill={element.backgroundColor || "rgba(0,0,0,0.01)"}
                        cornerRadius={element.backgroundColor ? 8 : 0}
                        shadowColor={element.backgroundColor && element.hasShadow ? (element.shadowColor || "rgba(0,0,0,0.2)") : "rgba(0,0,0,0.15)"}
                        shadowBlur={element.backgroundColor && element.hasShadow ? (element.shadowBlur ?? 20) : 15}
                        shadowOffsetX={element.backgroundColor && element.hasShadow ? (element.shadowOffsetX ?? 0) : 0}
                        shadowOffsetY={element.backgroundColor && element.hasShadow ? (element.shadowOffsetY ?? 10) : 5}
                        shadowOpacity={element.backgroundColor && element.hasShadow ? 1 : 0}
                    />
                    <Text
                        text={element.content}
                        width={element.width}
                        height={element.height}
                        fontSize={24}
                        fontFamily={fontFamily}
                        fontStyle={`${element.fontStyle || 'normal'} ${element.fontWeight || 'normal'}`}
                        textDecoration={element.textDecoration || 'none'}
                        align={element.textAlign || 'left'}
                        fill={element.strokeColor || DEFAULT_STROKE_COLOR} // use strokeColor to store text color natively
                        opacity={isEditing ? 0 : 1}
                        padding={element.backgroundColor ? 16 : 0}
                        shadowColor={!element.backgroundColor && element.hasShadow ? (element.shadowColor || "rgba(0,0,0,0.3)") : undefined}
                        shadowBlur={!element.backgroundColor && element.hasShadow ? (element.shadowBlur ?? 5) : 0}
                        shadowOffsetX={!element.backgroundColor && element.hasShadow ? (element.shadowOffsetX ?? 2) : 0}
                        shadowOffsetY={!element.backgroundColor && element.hasShadow ? (element.shadowOffsetY ?? 2) : 0}
                        shadowOpacity={!element.backgroundColor && element.hasShadow ? 1 : 0}
                    />
                    {isEditing && (
                        <Html
                            divProps={{
                                style: {
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: element.width,
                                    zIndex: 100,
                                }
                            }}
                        >
                            <textarea
                                value={element.content}
                                onChange={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                    onChange(element.id, {
                                        content: e.target.value,
                                        height: Math.max(50, e.target.scrollHeight)
                                    });
                                }}
                                onBlur={() => setIsEditing(false)}
                                autoFocus
                                className="w-full bg-transparent border-2 border-sage border-dashed outline-none resize-none text-[24px] m-0 rounded-lg shadow-xl"
                                style={{
                                    height: element.height || 50,
                                    minHeight: '50px',
                                    padding: element.backgroundColor ? '16px' : '8px',
                                    backgroundColor: element.backgroundColor || 'var(--color-paper)',
                                    color: element.strokeColor || DEFAULT_STROKE_COLOR,
                                    fontFamily: `"${fontFamily}", cursive`,
                                    fontWeight: element.fontWeight || 'normal',
                                    fontStyle: element.fontStyle || 'normal',
                                    textDecoration: element.textDecoration || 'none',
                                    textAlign: (element.textAlign || 'left') as 'left' | 'center' | 'right',
                                }}
                            />
                        </Html>
                    )}
                </Group>
            )}

            {element.type === 'video' && (
                <VideoElement
                    element={element}
                    isDraggable={isDraggable && !element.isLocked}
                    onSelect={() => { if (!element.isLocked) onSelect(element.id); }}
                    onDragEnd={handleDragEnd}
                    onDragMove={handleDragMove}
                    onTransformEnd={handleTransformEnd}
                    onNodeRegister={(node) => {
                        shapeRef.current = node as Konva.Image;
                        onNodeRegister?.(element.id, node);
                    }}
                />
            )}

            {element.type === 'gif' && (
                <GifElement
                    element={element}
                    isDraggable={isDraggable && !element.isLocked}
                    onSelect={() => { if (!element.isLocked) onSelect(element.id); }}
                    onDragEnd={handleDragEnd}
                    onDragMove={handleDragMove}
                    onTransformEnd={handleTransformEnd}
                    onNodeRegister={(node) => {
                        shapeRef.current = node as Konva.Image;
                        onNodeRegister?.(element.id, node);
                    }}
                />
            )}

            {(element.type === 'image' || element.type === 'sticker') && (
                <KonvaImage
                    ref={(node) => { shapeRef.current = node; }}
                    image={img}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    rotation={element.rotation || 0}
                    cornerRadius={element.type === 'sticker' ? 0 : 8}
                    shadowColor={element.hasShadow ? (element.shadowColor || "rgba(0,0,0,0.3)") : "rgba(0,0,0,0.15)"}
                    shadowBlur={element.hasShadow ? (element.shadowBlur ?? 25) : 15}
                    shadowOffsetX={element.hasShadow ? (element.shadowOffsetX ?? 0) : 0}
                    shadowOffsetY={element.hasShadow ? (element.shadowOffsetY ?? 15) : 5}
                    shadowOpacity={element.hasShadow ? 1 : 1}
                    draggable={isDraggable && !element.isLocked}
                    listening={isDraggable && !element.isLocked}
                    onClick={() => { if (!element.isLocked) onSelect(element.id); }}
                    onTap={() => { if (!element.isLocked) onSelect(element.id); }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragMove={handleDragMove}
                    onTransformEnd={handleTransformEnd}
                />
            )}

            {(element.type === 'line' || element.type === 'eraser') && (() => {
                // Determine stroke options based on brush type
                let strokeOptions = {
                    size: element.strokeWidth || 4,
                    thinning: 0,
                    smoothing: 0.5,
                    streamline: 0.5,
                    taperStart: 0,
                    taperEnd: 0
                };

                if (element.brushType === 'marker') {
                    strokeOptions = { ...strokeOptions, size: (element.strokeWidth || 4) * 1.5, thinning: -0.6, smoothing: 0.9, streamline: 0.1 };
                } else if (element.brushType === 'charcoal') {
                    strokeOptions = { ...strokeOptions, thinning: 0.9, smoothing: 0.1, streamline: 0.2, taperEnd: 10, taperStart: 10 };
                } else if (element.brushType === 'watercolor') {
                    strokeOptions = { ...strokeOptions, size: (element.strokeWidth || 4) * 3.5, thinning: 0.4, streamline: 0.8, smoothing: 0.9 };
                }

                // Convert flat points to [x, y] format
                const flatPoints = element.points || [];
                const pairedPoints = [];
                for (let i = 0; i < flatPoints.length; i += 2) {
                    pairedPoints.push([flatPoints[i], flatPoints[i + 1]]);
                }

                const pathData = getSvgPathFromStroke(getStroke(pairedPoints, strokeOptions));
                const isEraser = element.type === 'eraser';

                // We use Path for drawing tools utilizing perfect-freehand
                if (element.type === 'line') {
                    return (
                        <Path
                            ref={(node) => { shapeRef.current = node; }}
                            data={pathData}
                            fill={element.strokeColor || DEFAULT_STROKE_COLOR}
                            opacity={element.brushType === 'watercolor' ? 0.3 : (element.brushType === 'marker' ? 0.6 : 1)}
                            shadowColor={element.brushType === 'charcoal' ? element.strokeColor : undefined}
                            shadowBlur={element.brushType === 'charcoal' ? 2 : 0}
                            shadowOpacity={element.brushType === 'charcoal' ? 0.5 : 0}
                            x={element.x}
                            y={element.y}
                            rotation={element.rotation}
                            draggable={isDraggable && !element.isLocked}
                            listening={isDraggable && !element.isLocked}
                            onClick={() => { if (!element.isLocked) onSelect(element.id); }}
                            onTap={() => { if (!element.isLocked) onSelect(element.id); }}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragMove={handleDragMove}
                            globalCompositeOperation={
                                element.brushType === 'watercolor' || element.brushType === 'marker' ? 'multiply' : 'source-over'
                            }
                        />
                    );
                }

                // Fallback to standard Line for eraser
                return (
                    <Line
                        ref={(node) => { shapeRef.current = node; }}
                        points={element.points || []}
                        stroke={element.strokeColor || DEFAULT_STROKE_COLOR}
                        strokeWidth={element.strokeWidth || 4}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        x={element.x}
                        y={element.y}
                        rotation={element.rotation}
                        draggable={isDraggable && !element.isLocked}
                        listening={isDraggable && !element.isLocked}
                        onClick={() => { if (!element.isLocked) onSelect(element.id); }}
                        onTap={() => { if (!element.isLocked) onSelect(element.id); }}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragMove={handleDragMove}
                        hitStrokeWidth={20}
                        globalCompositeOperation='destination-out'
                    />
                );
            })()}

            {element.type === 'arrow' && (
                <Arrow
                    ref={(node) => { shapeRef.current = node; }}
                    points={element.points || []}
                    stroke={element.strokeColor || DEFAULT_STROKE_COLOR}
                    strokeWidth={element.strokeWidth || 4}
                    fill={element.strokeColor || DEFAULT_STROKE_COLOR}
                    lineCap="round"
                    lineJoin="round"
                    x={element.x}
                    y={element.y}
                    rotation={element.rotation}
                    draggable={isDraggable && !element.isLocked}
                    listening={isDraggable && !element.isLocked}
                    onClick={() => { if (!element.isLocked) onSelect(element.id); }}
                    onTap={() => { if (!element.isLocked) onSelect(element.id); }}
                    onDragEnd={handleDragEnd}
                    onDragMove={handleDragMove}
                    hitStrokeWidth={20}
                    pointerLength={10}
                    pointerWidth={10}
                />
            )}

            {isSelected && !isEditing && (
                <Rect
                    x={element.x - 5}
                    y={element.y - 5}
                    width={(element.width || 0) + 10}
                    height={(element.height || 50) + 10}
                    stroke={SELECTION_STROKE_COLOR}
                    strokeWidth={1}
                    dash={[4, 4]}
                    listening={false}
                />
            )}
        </Group>
    );
});

// Sub-component to handle Video Lifecycle
interface MediaElementProps {
    element: CanvasElement;
    isDraggable: boolean;
    onSelect: () => void;
    onDragStart?: (e: KonvaEventObject<DragEvent>) => void;
    onDragEnd: (e: KonvaEventObject<DragEvent>) => void;
    onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
    onTransformEnd: () => void;
    onNodeRegister: (node: Konva.Node) => void;
}

function VideoElement({ element, isDraggable, onSelect, onDragStart, onDragEnd, onDragMove, onTransformEnd, onNodeRegister }: MediaElementProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const konvaImageRef = useRef<Konva.Image | null>(null);

    // Callback ref: fires when KonvaImage mounts/updates its DOM node
    const registerRef = useCallback((node: Konva.Image | null) => {
        konvaImageRef.current = node;
        if (node) onNodeRegister(node);
    }, [onNodeRegister]);

    useEffect(() => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.playsInline = true;
        let aborted = false;

        const handleCanPlay = () => {
            if (!aborted) setVideoElement(video);
        };
        const handleError = (e: unknown) => {
            console.error("Video failed to load:", e);
        };

        const load = async () => {
            const src = isLocalRef(element.content)
                ? await resolveLocalUrl(element.content).catch(() => '')
                : element.content;
            if (aborted) return;
            video.src = src;
            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('error', handleError);
            videoRef.current = video;
            video.load();
        };

        load();

        return () => {
            aborted = true;
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            video.pause();
            video.src = "";
            video.load();
        };
    }, [element.content]);

    // React to property changes without recreating the video
    useEffect(() => {
        if (!videoElement) return;
        // eslint-disable-next-line react-hooks/immutability
        videoElement.loop = element.loop !== false;
        // eslint-disable-next-line react-hooks/immutability
        videoElement.muted = element.muted !== false;
        if (element.autoPlay === false) {
            videoElement.pause();
        } else {
            videoElement.play().catch(e => console.warn("Play block:", e));
        }
    }, [element.autoPlay, element.loop, element.muted, videoElement]);

    // Redraw loop for video frames
    useEffect(() => {
        if (!videoElement) return;
        let animFrame: number;
        const step = () => {
            const layer = konvaImageRef.current?.getLayer();
            if (layer) layer.batchDraw();
            animFrame = requestAnimationFrame(step);
        };
        animFrame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animFrame);
    }, [videoElement]);

    return (
        <KonvaImage
            ref={registerRef}
            image={videoElement || undefined}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rotation={element.rotation}
            cornerRadius={8}
            shadowColor="rgba(0,0,0,0.15)"
            shadowBlur={15}
            shadowOffsetY={5}
            draggable={isDraggable}
            listening={isDraggable}
            onClick={onSelect}
            onTap={onSelect}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragMove={onDragMove}
            onTransformEnd={onTransformEnd}
        />
    );
}

// Sub-component to handle Animated GIF rendering
function GifElement({ element, isDraggable, onSelect, onDragStart, onDragEnd, onDragMove, onTransformEnd, onNodeRegister }: MediaElementProps) {
    const [gifImage, setGifImage] = useState<HTMLImageElement | null>(null);
    const konvaImageRef = useRef<Konva.Image | null>(null);

    const registerRef = useCallback((node: Konva.Image | null) => {
        konvaImageRef.current = node;
        if (node) onNodeRegister(node);
    }, [onNodeRegister]);

    useEffect(() => {
        let aborted = false;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';

        const load = async () => {
            const src = isLocalRef(element.content)
                ? await resolveLocalUrl(element.content).catch(() => '')
                : element.content;
            if (aborted) return;
            img.src = src;
            img.onload = () => { if (!aborted) setGifImage(img); };
            img.onerror = (e) => console.error("GIF failed to load:", e);
        };

        load();
        return () => { aborted = true; };
    }, [element.content]);

    // Continuous redraw for GIF animation frames
    useEffect(() => {
        if (!gifImage) return;
        let animFrame: number;
        const step = () => {
            const layer = konvaImageRef.current?.getLayer();
            if (layer) layer.batchDraw();
            animFrame = requestAnimationFrame(step);
        };
        animFrame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(animFrame);
    }, [gifImage]);

    return (
        <KonvaImage
            ref={registerRef}
            image={gifImage || undefined}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rotation={element.rotation}
            cornerRadius={8}
            shadowColor="rgba(0,0,0,0.15)"
            shadowBlur={15}
            shadowOffsetY={5}
            draggable={isDraggable}
            listening={isDraggable}
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={onDragEnd}
            onDragMove={onDragMove}
            onTransformEnd={onTransformEnd}
        />
    );
}
