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
    activeTool: 'select' | 'draw';
}

export default function InfiniteCanvas({ elements, onElementChange, onAddElement, scale, setScale, activeTool }: InfiniteCanvasProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stageRef = useRef<any>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [currentLine, setCurrentLine] = useState<CanvasElement | null>(null);

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

        const scaleBy = 1.05;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();

        const mousePointTo = {
            x: stage.getPointerPosition()!.x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition()!.y / oldScale - stage.y() / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        setScale(newScale);

        setPosition({
            x: -(mousePointTo.x - stage.getPointerPosition()!.x / newScale) * newScale,
            y: -(mousePointTo.y - stage.getPointerPosition()!.y / newScale) * newScale,
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseDown = (e: any) => {
        if (activeTool === 'draw') {
            const stage = e.target.getStage();
            const pointerPosition = stage.getPointerPosition();
            if (!pointerPosition) return;
            const pos = {
                x: (pointerPosition.x - stage.x()) / scale,
                y: (pointerPosition.y - stage.y()) / scale,
            };

            setCurrentLine({
                id: crypto.randomUUID(),
                type: 'line',
                content: '',
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                rotation: 0,
                zIndex: elements.length + 1,
                points: [pos.x, pos.y],
                strokeColor: '#f472b6', // pink-400
                strokeWidth: 4,
            });
        } else {
            const clickedOnEmpty = e.target === e.target.getStage();
            if (clickedOnEmpty) {
                setSelectedId(null);
            }
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMouseMove = (e: any) => {
        if (activeTool !== 'draw' || !currentLine) return;

        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        if (!pointerPosition) return;
        const pos = {
            x: (pointerPosition.x - stage.x()) / scale,
            y: (pointerPosition.y - stage.y()) / scale,
        };

        setCurrentLine({
            ...currentLine,
            points: [...(currentLine.points || []), pos.x, pos.y]
        });
    };

    const handleMouseUp = () => {
        if (activeTool === 'draw' && currentLine) {
            if (onAddElement) onAddElement(currentLine);
            setCurrentLine(null);
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
            draggable={activeTool === 'select' && selectedId === null} // only pan stage when nothing is selected
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            ref={stageRef}
            className={`absolute inset-0 z-0 ${activeTool === 'draw' ? 'cursor-crosshair' : (selectedId === null ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')}`}
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
                        isSelected={el.id === selectedId}
                        onSelect={() => setSelectedId(el.id)}
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
            </Layer>
        </Stage>
    );
}
