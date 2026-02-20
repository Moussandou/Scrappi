"use client";

import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { CanvasElement } from "@/domain/entities";
import { RenderElement } from "./RenderElement";

interface InfiniteCanvasProps {
    elements: CanvasElement[];
}

export default function InfiniteCanvas({ elements, onElementChange }: InfiniteCanvasProps & { onElementChange?: (id: string, partial: any) => void }) {
    const stageRef = useRef<any>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Handle window resize
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

    const handleDragEnd = (id: string, x: number, y: number) => {
        if (onElementChange) onElementChange(id, { x, y });
    };

    if (dimensions.width === 0) return null; // Avoid rendering before dimensions are known

    return (
        <Stage
            width={dimensions.width}
            height={dimensions.height}
            onWheel={handleWheel}
            draggable
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            ref={stageRef}
            className="absolute inset-0 cursor-grab active:cursor-grabbing z-0"
        >
            <Layer>
                {/* Helper grid for visual feedback while panning */}
                <Rect
                    x={-10000}
                    y={-10000}
                    width={20000}
                    height={20000}
                    fillPatternImage={(() => { /* We rely on CSS background for the whole page */ return undefined })()}
                />
                {elements.map((el) => (
                    <RenderElement key={el.id} element={el} onDragEnd={handleDragEnd} />
                ))}
            </Layer>
        </Stage>
    );
}
