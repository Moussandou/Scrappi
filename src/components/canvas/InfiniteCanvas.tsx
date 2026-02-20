"use client";

import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { CanvasElement } from "@/domain/entities";
import { RenderElement } from "./RenderElement";

interface InfiniteCanvasProps {
    elements: CanvasElement[];
    onElementChange?: (id: string, partial: Partial<CanvasElement>) => void;
    onAddElement?: (element: CanvasElement) => void;
    scale: number;
    setScale: (s: number) => void;
    position: { x: number, y: number };
    setPosition: (pos: { x: number, y: number }) => void;
    activeTool: 'select' | 'draw' | 'arrow' | 'eraser';
    activeColor: string;
    selectedIds: string[];
    setSelectedIds: (ids: string[]) => void;
}

export default function InfiniteCanvas({
    elements,
    onElementChange,
    onAddElement,
    scale,
    setScale,
    position,
    setPosition,
    activeTool,
    activeColor,
    selectedIds,
    setSelectedIds
}: InfiniteCanvasProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stageRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [currentLine, setCurrentLine] = useState<CanvasElement | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);


    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const oldScale = scale;

        // If ctrl or cmd is pressed, we zoom
        if (e.evt.ctrlKey || e.evt.metaKey) {
            const scaleBy = 1.05;
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: pointer.x / oldScale - stage.x() / oldScale,
                y: pointer.y / oldScale - stage.y() / oldScale,
            };

            const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            setScale(newScale);

            setPosition({
                x: -(mousePointTo.x - pointer.x / newScale) * newScale,
                y: -(mousePointTo.y - pointer.y / newScale) * newScale,
            });
        } else {
            // Otherwise we pan (smooth scroll)
            setPosition({
                x: position.x - e.evt.deltaX,
                y: position.y - e.evt.deltaY,
            });
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseDown = (e: any) => {
        const isPaint = activeTool === 'draw' || activeTool === 'eraser';
        const isArrow = activeTool === 'arrow';

        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        if (!pointerPosition) return;

        const pos = {
            x: (pointerPosition.x - stage.x()) / scale,
            y: (pointerPosition.y - stage.y()) / scale,
        };

        if (isPaint || isArrow) {
            setCurrentLine({
                id: crypto.randomUUID(),
                type: activeTool === 'eraser' ? 'eraser' : (isArrow ? 'arrow' : 'line'),
                content: '',
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                rotation: 0,
                zIndex: elements.length + 1,
                points: [pos.x, pos.y],
                strokeColor: activeColor,
                strokeWidth: 4,
            });
        } else if (activeTool === 'select') {
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) {
                setSelectedIds([]);
                setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
            }
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        if (!pointerPosition) return;

        const pos = {
            x: (pointerPosition.x - stage.x()) / scale,
            y: (pointerPosition.y - stage.y()) / scale,
        };

        if (currentLine) {
            if (currentLine.type === 'arrow') {
                const startX = currentLine.points![0];
                const startY = currentLine.points![1];
                setCurrentLine({
                    ...currentLine,
                    points: [startX, startY, pos.x, pos.y]
                });
            } else {
                setCurrentLine({
                    ...currentLine,
                    points: [...(currentLine.points || []), pos.x, pos.y]
                });
            }
        } else if (selectionBox) {
            setSelectionBox({ ...selectionBox, x2: pos.x, y2: pos.y });
        }
    };

    const handleMouseUp = () => {
        if (currentLine) {
            if (onAddElement) onAddElement(currentLine);
            setCurrentLine(null);
        } else if (selectionBox) {
            // Box selection logic
            const x1 = Math.min(selectionBox.x1, selectionBox.x2);
            const y1 = Math.min(selectionBox.y1, selectionBox.y2);
            const x2 = Math.max(selectionBox.x1, selectionBox.x2);
            const y2 = Math.max(selectionBox.y1, selectionBox.y2);

            const selected = elements.filter(el => {
                // Approximate bounding boxes for simplicity
                const elX = el.x;
                const elY = el.y;
                const elW = el.width || 0;
                const elH = el.height || 0;

                // For lines and arrows, check points (simplified)
                if (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser') {
                    if (!el.points) return false;
                    const xs = el.points.filter((_, i) => i % 2 === 0);
                    const ys = el.points.filter((_, i) => i % 2 === 1);
                    const minX = Math.min(...xs);
                    const minY = Math.min(...ys);
                    const maxX = Math.max(...xs);
                    const maxY = Math.max(...ys);
                    return maxX >= x1 && minX <= x2 && maxY >= y1 && minY <= y2;
                }

                return elX + elW >= x1 && elX <= x2 && elY + elH >= y1 && elY <= y2;
            }).map(el => el.id);

            setSelectedIds(selected);
            setSelectionBox(null);
        }
    };

    if (dimensions.width === 0) return null;

    return (
        <Stage
            width={dimensions.width}
            height={dimensions.height}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            draggable={activeTool === 'select' && selectedIds.length === 0}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            ref={stageRef}
            className={`absolute inset-0 z-0 ${activeTool === 'draw' || activeTool === 'eraser' || activeTool === 'arrow' ? 'cursor-crosshair' : (selectedIds.length === 0 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')}`}
        >
            <Layer>
                <Rect
                    x={-10000}
                    y={-10000}
                    width={20000}
                    height={20000}
                />
                {elements.map((el) => (
                    <RenderElement
                        key={el.id}
                        element={el}
                        isSelected={selectedIds.includes(el.id)}
                        onSelect={() => {
                            if (activeTool === 'select') {
                                setSelectedIds([el.id]);
                            }
                        }}
                        onChange={(id, newProps) => {
                            if (onElementChange) onElementChange(id, newProps);
                        }}
                        isDraggable={activeTool === 'select'}
                    />
                ))}
                {currentLine && (
                    <RenderElement
                        element={currentLine}
                        isSelected={false}
                        onSelect={() => { }}
                        onChange={() => { }}
                        isDraggable={false}
                    />
                )}
                {selectionBox && (
                    <Rect
                        x={Math.min(selectionBox.x1, selectionBox.x2)}
                        y={Math.min(selectionBox.y1, selectionBox.y2)}
                        width={Math.abs(selectionBox.x2 - selectionBox.x1)}
                        height={Math.abs(selectionBox.y2 - selectionBox.y1)}
                        fill="rgba(138, 154, 134, 0.2)"
                        stroke="#8a9a86"
                        strokeWidth={1}
                        dash={[5, 5]}
                    />
                )}
            </Layer>
        </Stage>
    );
}
