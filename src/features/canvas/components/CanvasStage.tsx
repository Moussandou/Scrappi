"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Transformer } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { CanvasElement } from "@/domain/entities";
import { RenderElement } from "./ElementRenderer";
import { SELECTION_STROKE_COLOR, SELECTION_FILL_COLOR } from "../constants";

interface InfiniteCanvasProps {
    elements: CanvasElement[];
    onElementChange?: (id: string, partial: Partial<CanvasElement>) => void;
    onElementsChange?: (changes: Array<{ id: string, partial: Partial<CanvasElement> }>) => void;
    onAddElement?: (element: CanvasElement) => void;
    scale: number;
    setScale: (s: number) => void;
    position: { x: number, y: number };
    setPosition: (pos: { x: number, y: number }) => void;
    activeTool: 'select' | 'draw' | 'arrow' | 'eraser' | 'hand';
    activeColor: string;
    activeStrokeWidth: number;
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
    activeStrokeWidth,
    selectedIds,
    setSelectedIds,
    onElementsChange
}: InfiniteCanvasProps) {
    const stageRef = useRef<Konva.Stage | null>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const nodesRef = useRef<Record<string, Konva.Node>>({});

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [currentLine, setCurrentLine] = useState<CanvasElement | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

    // Refs for stable callbacks
    const elementsRef = useRef(elements);
    const selectedIdsRef = useRef(selectedIds);
    const activeToolRef = useRef(activeTool);

    useEffect(() => {
        elementsRef.current = elements;
    }, [elements]);

    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    useEffect(() => {
        activeToolRef.current = activeTool;
    }, [activeTool]);

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

    // Sync transformer nodes when selectedIds or nodesRef change
    useEffect(() => {
        if (transformerRef.current) {
            const selectedNodes = selectedIds
                .map(id => nodesRef.current[id])
                .filter(node => !!node) as Konva.Node[];

            transformerRef.current.nodes(selectedNodes);
            transformerRef.current.getLayer()?.batchDraw();
        }
    }, [selectedIds, elements]); // also sync on elements change to handle z-index swaps

    const handleNodeRegister = useCallback((id: string, node: Konva.Node) => {
        nodesRef.current[id] = node;
    }, []);


    const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

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

    const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        const isPaint = activeTool === 'draw' || activeTool === 'eraser';
        const isArrow = activeTool === 'arrow';

        const stage = e.target.getStage();
        if (!stage) return;
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
                strokeColor: activeTool === 'eraser' ? '#ffffff' : activeColor,
                strokeWidth: activeTool === 'eraser' ? activeStrokeWidth * 3 : activeStrokeWidth,
            });
        } else if (activeTool === 'select') {
            const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background-rect';
            if (clickedOnEmpty) {
                setSelectedIds([]);
                setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
            }
        }
    };

    const handleMouseMove = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        const stage = e.target.getStage();
        if (!stage) return;
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

    const handleSelect = useCallback((id: string) => {
        if (activeToolRef.current === 'select') {
            setSelectedIds([id]);
        }
    }, [setSelectedIds]);

    const handleElementChange = useCallback((id: string, newProps: Partial<CanvasElement>) => {
        const currentSelectedIds = selectedIdsRef.current;
        const currentElements = elementsRef.current;

        if (currentSelectedIds.includes(id) && (newProps.x !== undefined || newProps.y !== undefined)) {
            // Multi-drag logic
            const el = currentElements.find(e => e.id === id);
            if (!el) return;
            const dx = (newProps.x ?? el.x) - el.x;
            const dy = (newProps.y ?? el.y) - el.y;

            if (dx !== 0 || dy !== 0) {
                const changes = currentSelectedIds.map(sid => {
                    const selEl = currentElements.find(e => e.id === sid);
                    if (!selEl) return null;
                    return {
                        id: sid,
                        partial: {
                            x: selEl.x + dx,
                            y: selEl.y + dy
                        }
                    };
                }).filter(c => c !== null) as Array<{ id: string, partial: Partial<CanvasElement> }>;

                if (onElementsChange) onElementsChange(changes);
                return;
            }
        }
        if (onElementChange) onElementChange(id, newProps);
    }, [onElementsChange, onElementChange]);

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
                const elH = el.height || 50;

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
            draggable={activeTool === 'hand'}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            ref={stageRef}
            className={`absolute inset-0 z-0 ${activeTool === 'draw' || activeTool === 'eraser' || activeTool === 'arrow' ? 'cursor-crosshair' : (activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')}`}
        >
            <Layer>
                <Rect
                    name="background-rect"
                    x={-50000}
                    y={-50000}
                    width={100000}
                    height={100000}
                    fill="transparent"
                />
                {elements.map((el) => (
                    <RenderElement
                        key={el.id}
                        element={el}
                        isSelected={selectedIds.includes(el.id)}
                        onSelect={handleSelect}
                        onChange={handleElementChange}
                        isDraggable={activeTool === 'select'}
                        onNodeRegister={handleNodeRegister}
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
                        fill={SELECTION_FILL_COLOR}
                        stroke={SELECTION_STROKE_COLOR}
                        strokeWidth={1}
                        dash={[5, 5]}
                    />
                )}
                {activeTool === 'select' && selectedIds.length > 0 && (
                    <Transformer
                        ref={transformerRef}
                        anchorFill={SELECTION_STROKE_COLOR}
                        anchorStroke="#ffffff"
                        anchorSize={10}
                        anchorCornerRadius={3}
                        borderStroke={SELECTION_STROKE_COLOR}
                        borderStrokeWidth={2}
                        borderDash={[4, 4]}
                        padding={10}
                        rotateAnchorOffset={30}
                        shouldOverdrawWholeArea
                        onTransformEnd={() => {
                            if (!transformerRef.current) return;
                            const nodes = transformerRef.current.nodes();
                            // Update all selected elements based on their new node attributes
                            if (onElementChange) {
                                nodes.forEach((node: Konva.Node) => {
                                    if (!nodesRef.current) return;
                                    const id = Object.keys(nodesRef.current).find(key => nodesRef.current[key] === node);
                                    if (id) {
                                        const scaleX = node.scaleX();
                                        const scaleY = node.scaleY();
                                        node.scaleX(1);
                                        node.scaleY(1);

                                        onElementChange(id, {
                                            x: node.x(),
                                            y: node.y(),
                                            width: Math.max(5, node.width() * scaleX),
                                            height: Math.max(5, node.height() * scaleY),
                                            rotation: node.rotation()
                                        });
                                    }
                                });
                            }
                        }}
                        boundBoxFunc={(oldBox, newBox) => {
                            if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                                return oldBox;
                            }
                            return newBox;
                        }}
                    />
                )}
            </Layer>
        </Stage>
    );
}
