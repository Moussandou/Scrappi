"use client";

import { useRef, useEffect, useState } from "react";
import { Text, Image as KonvaImage, Transformer, Group } from "react-konva";
import { Html } from "react-konva-utils";
import useImage from "use-image";
import { CanvasElement } from "@/domain/entities";

interface ElementProps {
    element: CanvasElement;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (id: string, newProps: any) => void;
}

export function RenderElement({ element, isSelected, onSelect, onChange }: ElementProps) {
    const shapeRef = useRef<any>(null);
    const trRef = useRef<any>(null);
    const [img] = useImage(element.type === 'image' || element.type === 'sticker' ? element.content : '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const handleDragEnd = (e: any) => {
        onChange(element.id, {
            x: e.target.x(),
            y: e.target.y()
        });
    };

    const handleTransformEnd = (e: any) => {
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

    return (
        <Group>
            {element.type === 'text' && (
                <>
                    <Text
                        ref={shapeRef}
                        text={element.content}
                        x={element.x}
                        y={element.y}
                        width={element.width}
                        fontSize={24}
                        fontFamily="var(--font-handwriting, Caveat)"
                        fill="#1a1e26" // ink
                        opacity={isEditing ? 0 : 1}
                        rotation={element.rotation}
                        draggable
                        onClick={onSelect}
                        onTap={onSelect}
                        onDblClick={handleDoubleClick}
                        onDblTap={handleDoubleClick}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                    />
                    {isEditing && (
                        <Html
                            divProps={{
                                style: {
                                    position: 'absolute',
                                    top: element.y,
                                    left: element.x,
                                    width: element.width,
                                    transform: `rotate(${element.rotation}deg)`,
                                    transformOrigin: 'top left',
                                }
                            }}
                        >
                            <textarea
                                value={element.content}
                                onChange={(e) => onChange(element.id, { content: e.target.value })}
                                onBlur={() => setIsEditing(false)}
                                autoFocus
                                className="w-full bg-transparent border-none outline-none resize-none font-handwriting text-[24px] text-ink overflow-hidden p-0 m-0"
                                style={{
                                    height: 'auto',
                                    minHeight: '50px'
                                }}
                            />
                        </Html>
                    )}
                </>
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
                    draggable
                    onClick={onSelect}
                    onTap={onSelect}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                />
            )}

            {isSelected && !isEditing && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // limit resize
                        if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </Group>
    );
}
