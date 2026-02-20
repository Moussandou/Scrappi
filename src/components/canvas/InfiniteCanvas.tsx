"use client";

import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { CanvasElement } from "@/domain/entities";
import { RenderElement } from "./RenderElement";

interface InfiniteCanvasProps {
    elements: CanvasElement[];
    onElementChange?: (id: string, partial: any) => void;
}

export default function InfiniteCanvas({ elements, onElementChange }: InfiniteCanvasProps) {
    const stageRef = useRef<any>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [selectedId, setSelectedId] = useState<string | null>(null);

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

    const checkDeselect = (e: any) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            setSelectedId(null);
        }
    };

    if (dimensions.width === 0) return null;

    return (
        <Stage
            width={dimensions.width}
            height={dimensions.height}
            onWheel={handleWheel}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            draggable={selectedId === null} // only pan stage when nothing is selected
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            ref={stageRef}
            className={`absolute inset-0 z-0 ${selectedId === null ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
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
                    />
                ))}
            </Layer>
        </Stage>
    );
}
