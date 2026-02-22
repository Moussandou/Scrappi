"use client";

import { useRef, useEffect, useState, useCallback, memo } from "react";
import { Text, Image as KonvaImage, Transformer, Group, Rect, Line, Arrow } from "react-konva";
import { Html } from "react-konva-utils";
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
    onNodeRegister?: (id: string, node: any) => void;
}

export const RenderElement = memo(function RenderElement({ element, isSelected, onSelect, onChange, isDraggable, onNodeRegister }: ElementProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapeRef = useRef<any>(null);
    const isImageType = element.type === 'image' || element.type === 'sticker';
    const [resolvedSrc, setResolvedSrc] = useState(isImageType && !isLocalRef(element.content) ? element.content : '');
    const [img] = useImage(resolvedSrc, resolvedSrc ? 'anonymous' : undefined);
    const [isEditing, setIsEditing] = useState(false);

    // Resolve local: URLs to blob URLs for image types
    useEffect(() => {
        if (!isImageType) return;
        if (isLocalRef(element.content)) {
            resolveLocalUrl(element.content)
                .then(url => setResolvedSrc(url))
                .catch(() => setResolvedSrc(''));
        } else {
            setResolvedSrc(element.content);
        }
    }, [element.content, isImageType]);

    // Register node for Transformer
    useEffect(() => {
        if (shapeRef.current && onNodeRegister) {
            onNodeRegister(element.id, shapeRef.current);
        }
    }, [onNodeRegister, element.id]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDragEnd = (e: any) => {
        onChange(element.id, {
            x: e.target.x(),
            y: e.target.y()
        });
    };

    const handleTransformEnd = () => {
        const node = shapeRef.current;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        onChange(element.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
            rotation: node.rotation()
        });
    };

    const handleDoubleClick = () => {
        if (element.type === 'text') {
            setIsEditing(true);
        }
    };

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
                    ref={shapeRef}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height || 50}
                    rotation={element.rotation}
                    draggable={isDraggable}
                    listening={isDraggable}
                    onClick={() => onSelect(element.id)}
                    onTap={() => onSelect(element.id)}
                    onDblClick={handleDoubleClick}
                    onDblTap={handleDoubleClick}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                >
                    {/* Hit area: makes the entire bounding box grabbable */}
                    <Rect
                        width={element.width}
                        height={element.height || 50}
                        fill={element.backgroundColor || "transparent"}
                        cornerRadius={element.backgroundColor ? 8 : 0}
                        shadowColor={element.backgroundColor ? "rgba(0,0,0,0.1)" : undefined}
                        shadowBlur={element.backgroundColor ? 10 : 0}
                        shadowOffsetY={element.backgroundColor ? 4 : 0}
                    />
                    <Text
                        text={element.content}
                        width={element.width}
                        height={element.height}
                        fontSize={24}
                        fontFamily={fontFamily}
                        fill={element.strokeColor || DEFAULT_STROKE_COLOR} // use strokeColor to store text color natively
                        opacity={isEditing ? 0 : 1}
                        padding={element.backgroundColor ? 16 : 0}
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
                                }}
                            />
                        </Html>
                    )}
                </Group>
            )}

            {element.type === 'video' && (
                <VideoElement
                    element={element}
                    isDraggable={isDraggable}
                    onSelect={() => onSelect(element.id)}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                    onNodeRegister={(node) => {
                        shapeRef.current = node;
                        onNodeRegister?.(element.id, node);
                    }}
                />
            )}

            {element.type === 'gif' && (
                <GifElement
                    element={element}
                    isDraggable={isDraggable}
                    onSelect={() => onSelect(element.id)}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                    onNodeRegister={(node) => {
                        shapeRef.current = node;
                        onNodeRegister?.(element.id, node);
                    }}
                />
            )}

            {(element.type === 'image' || element.type === 'sticker') && (
                <KonvaImage
                    ref={shapeRef}
                    image={img}
                    x={element.x}
                    y={element.y}
                    width={element.width}
                    height={element.height}
                    rotation={element.rotation}
                    draggable={isDraggable}
                    listening={isDraggable}
                    onClick={() => onSelect(element.id)}
                    onTap={() => onSelect(element.id)}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                />
            )}

            {(element.type === 'line' || element.type === 'eraser') && (
                <Line
                    ref={shapeRef}
                    points={element.points || []}
                    stroke={element.strokeColor || DEFAULT_STROKE_COLOR}
                    strokeWidth={element.strokeWidth || 4}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    x={element.x}
                    y={element.y}
                    rotation={element.rotation}
                    draggable={isDraggable}
                    listening={isDraggable}
                    onClick={() => onSelect(element.id)}
                    onTap={() => onSelect(element.id)}
                    onDragEnd={handleDragEnd}
                    hitStrokeWidth={20}
                    globalCompositeOperation={element.type === 'eraser' ? 'destination-out' : 'source-over'}
                />
            )}

            {element.type === 'arrow' && (
                <Arrow
                    ref={shapeRef}
                    points={element.points || []}
                    stroke={element.strokeColor || DEFAULT_STROKE_COLOR}
                    strokeWidth={element.strokeWidth || 4}
                    fill={element.strokeColor || DEFAULT_STROKE_COLOR}
                    lineCap="round"
                    lineJoin="round"
                    x={element.x}
                    y={element.y}
                    rotation={element.rotation}
                    draggable={isDraggable}
                    listening={isDraggable}
                    onClick={() => onSelect(element.id)}
                    onTap={() => onSelect(element.id)}
                    onDragEnd={handleDragEnd}
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
    onDragEnd: (e: any) => void;
    onTransformEnd: () => void;
    onNodeRegister: (node: any) => void;
}

function VideoElement({ element, isDraggable, onSelect, onDragEnd, onTransformEnd, onNodeRegister }: MediaElementProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const konvaImageRef = useRef<any>(null);

    // Callback ref: fires when KonvaImage mounts/updates its DOM node
    const registerRef = useCallback((node: any) => {
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
        const handleError = (e: any) => {
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
        videoElement.loop = element.loop !== false;
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
            draggable={isDraggable}
            listening={isDraggable}
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd}
        />
    );
}

// Sub-component to handle Animated GIF rendering
function GifElement({ element, isDraggable, onSelect, onDragEnd, onTransformEnd, onNodeRegister }: MediaElementProps) {
    const [gifImage, setGifImage] = useState<HTMLImageElement | null>(null);
    const konvaImageRef = useRef<any>(null);

    const registerRef = useCallback((node: any) => {
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
            draggable={isDraggable}
            listening={isDraggable}
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={onDragEnd}
            onTransformEnd={onTransformEnd}
        />
    );
}
