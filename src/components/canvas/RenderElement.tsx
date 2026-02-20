"use client";

import { Text, Image as KonvaImage } from "react-konva";
import useImage from "use-image";
import { CanvasElement } from "@/domain/entities";

interface ElementProps {
    element: CanvasElement;
    onDragEnd: (id: string, x: number, y: number) => void;
}

export function RenderElement({ element, onDragEnd }: ElementProps) {
    const [img] = useImage(element.type === 'image' || element.type === 'sticker' ? element.content : '');

    const handleDragEnd = (e: any) => {
        onDragEnd(element.id, e.target.x(), e.target.y());
    };

    if (element.type === 'text') {
        return (
            <Text
                text={element.content}
                x={element.x}
                y={element.y}
                fontSize={24}
                fontFamily="Caveat"
                fill="#f3e9d2"
                rotation={element.rotation}
                draggable
                onDragEnd={handleDragEnd}
            />
        );
    }

    if (element.type === 'image' || element.type === 'sticker') {
        return (
            <KonvaImage
                image={img}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                rotation={element.rotation}
                draggable
                onDragEnd={handleDragEnd}
            />
        );
    }

    return null;
}
