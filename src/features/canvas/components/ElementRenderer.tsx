"use client";

import { useRef, useEffect, useState } from "react";
import { Text, Image as KonvaImage, Transformer, Group, Rect, Line, Arrow } from "react-konva";
import { Html } from "react-konva-utils";
import useImage from "use-image";
import { CanvasElement } from "@/domain/entities";
import { loadFont } from "@/infra/fonts/googleFontsService";

const DEFAULT_FONT = "Inter";

interface ElementProps {
    element: CanvasElement;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (id: string, newProps: Partial<CanvasElement>) => void;
    isDraggable: boolean;
}

export function RenderElement({ element, isSelected, onSelect, onChange, isDraggable }: ElementProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shapeRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trRef = useRef<any>(null);
    const [img] = useImage(element.type === 'image' || element.type === 'sticker' ? element.content : '');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (isSelected && trRef.current && shapeRef.current) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

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
                    onClick={onSelect}
                    onTap={onSelect}
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
                        fill={element.strokeColor || "#1a1e26"} // use strokeColor to store text color natively
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
                                    color: element.strokeColor || '#1a1e26',
                                    fontFamily: `"${fontFamily}", cursive`,
                                }}
                            />
                        </Html>
                    )}
                </Group>
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
                    onClick={onSelect}
                    onTap={onSelect}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                />
            )}

            {(element.type === 'line' || element.type === 'eraser') && (
                <Line
                    ref={shapeRef}
                    points={element.points || []}
                    stroke={element.strokeColor || '#1a1e26'}
                    strokeWidth={element.strokeWidth || 4}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    x={element.x}
                    y={element.y}
                    rotation={element.rotation}
                    draggable={isDraggable}
                    listening={isDraggable}
                    onClick={onSelect}
                    onTap={onSelect}
                    onDragEnd={handleDragEnd}
                    hitStrokeWidth={20}
                    globalCompositeOperation={element.type === 'eraser' ? 'destination-out' : 'source-over'}
                />
            )}

            {element.type === 'arrow' && (
                <Arrow
                    ref={shapeRef}
                    points={element.points || []}
                    stroke={element.strokeColor || '#1a1e26'}
                    strokeWidth={element.strokeWidth || 4}
                    fill={element.strokeColor || '#1a1e26'}
                    lineCap="round"
                    lineJoin="round"
                    x={element.x}
                    y={element.y}
                    rotation={element.rotation}
                    draggable={isDraggable}
                    listening={isDraggable}
                    onClick={onSelect}
                    onTap={onSelect}
                    onDragEnd={handleDragEnd}
                    hitStrokeWidth={20}
                    pointerLength={10}
                    pointerWidth={10}
                />
            )}

            {isSelected && !isEditing && (
                <Transformer
                    ref={trRef}
                    anchorFill="#8a9a86"
                    anchorStroke="#ffffff"
                    anchorSize={10}
                    anchorCornerRadius={3}
                    borderStroke="#8a9a86"
                    borderStrokeWidth={2}
                    borderDash={[4, 4]}
                    padding={10}
                    rotateAnchorOffset={30}
                    shouldOverdrawWholeArea
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
