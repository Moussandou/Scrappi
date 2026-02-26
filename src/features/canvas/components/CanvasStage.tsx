"use client";

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Rect, Transformer, Line } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import Konva from "konva";
import { CanvasElement } from "@/domain/entities";
import { RenderElement } from "./ElementRenderer";
import { SELECTION_STROKE_COLOR, SELECTION_FILL_COLOR } from "../constants";
import { useCanvasStore } from "../store/useCanvasStore";
import { useSnapping } from "../hooks/useSnapping";

import { ExportOptions } from "./ExportModal";

export interface CanvasStageRef {
    exportImage: (title: string, paperColor: string, options: ExportOptions) => void;
}

const EMPTY_ARRAY: any[] = [];
const DEFAULT_POSITION = { x: 0, y: 0 };

const NO_OP = () => { };

const InfiniteCanvas = forwardRef<CanvasStageRef>((props, ref) => {
    const { guidelines, setGuidelines, getSnappingOffset } = useSnapping();
    const elements = useCanvasStore(state => state?.elements) || EMPTY_ARRAY;
    const selectedIds = useCanvasStore(state => state?.selectedIds) || EMPTY_ARRAY;
    const scale = useCanvasStore(state => state?.scale) ?? 1;
    const position = useCanvasStore(state => state?.position) || DEFAULT_POSITION;

    // Actions retrieved individually to avoid "getSnapshot" infinite loop
    const setScale = useCanvasStore(state => state?.setScale) || NO_OP;
    const setPosition = useCanvasStore(state => state?.setPosition) || NO_OP;
    const updateElement = useCanvasStore(state => state?.updateElement) || NO_OP;
    const updateElements = useCanvasStore(state => state?.updateElements) || NO_OP;
    const addElement = useCanvasStore(state => state?.addElement) || NO_OP;
    const setSelectedIds = useCanvasStore(state => state?.setSelectedIds) || NO_OP;
    const removeElements = useCanvasStore(state => state?.removeElements) || NO_OP;

    const activeTool = useCanvasStore(state => state?.activeTool) || 'select';
    const activeColor = useCanvasStore(state => state?.activeColor) || '#000000';
    const activeStrokeWidth = useCanvasStore(state => state?.activeStrokeWidth) || 2;

    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage | null>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const nodesRef = useRef<Record<string, Konva.Node>>({});
    const lastTouchRef = useRef<{ dist: number, center: { x: number, y: number } } | null>(null);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [currentLine, setCurrentLine] = useState<CanvasElement | null>(null);
    const [selectionBox, setSelectionBox] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    useImperativeHandle(ref, () => ({
        exportImage: async (title: string, paperColor: string = '#ffffff', options: ExportOptions) => {
            if (!containerRef.current || !stageRef.current) return;
            const stage = stageRef.current;

            if (elementsRef.current.length === 0) return;

            // Deselect all slightly before rendering to hide Transformer
            const prevSelection = [...selectedIdsRef.current];
            setSelectedIds([]);
            setIsExporting(true);

            setTimeout(async () => {
                const oldScale = stage.scaleX();
                const oldPos = stage.position();

                const layer = stage.getLayers()[0];
                let bgRect: Konva.Rect | null = null;

                try {
                    // Add background rect if not transparent
                    if (!options.transparentBackground) {
                        bgRect = new Konva.Rect({
                            x: -100000,
                            y: -100000,
                            width: 200000,
                            height: 200000,
                            fill: paperColor,
                            listening: false,
                            id: 'temp-bg-rect'
                        });
                        layer.add(bgRect);
                        bgRect.moveToBottom();
                    }

                    // Temporarily un-scale the stage to take a 1:1 picture
                    stage.scale({ x: 1, y: 1 });
                    stage.position({ x: 0, y: 0 });
                    stage.draw();

                    // Minimum wait for React & Konva to sync, rendering all un-culled elements
                    await new Promise(resolve => setTimeout(resolve, 150));

                    // Get precise bounding box of content from elements data (safe from Konva artifacts)
                    let minX = Infinity;
                    let minY = Infinity;
                    let maxX = -Infinity;
                    let maxY = -Infinity;

                    elementsRef.current.forEach(el => {
                        let ex1 = el.x;
                        let ey1 = el.y;
                        let ex2 = el.x + (el.width || 0);
                        let ey2 = el.y + (el.height || 0);

                        if (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser') {
                            if (el.points && el.points.length > 0) {
                                const xs = el.points.filter((_, i) => i % 2 === 0);
                                const ys = el.points.filter((_, i) => i % 2 === 1);
                                ex1 = el.x + Math.min(...xs);
                                ey1 = el.y + Math.min(...ys);
                                ex2 = el.x + Math.max(...xs);
                                ey2 = el.y + Math.max(...ys);
                            }
                        }

                        // Safeguard: ignore elements placed abnormally far or abnormally large to prevent memory crash
                        if (
                            Math.abs(ex1) > 20000 || Math.abs(ey1) > 20000 ||
                            Math.abs(ex2) > 20000 || Math.abs(ey2) > 20000 ||
                            isNaN(ex1) || isNaN(ey1) || isNaN(ex2) || isNaN(ey2)
                        ) return;

                        if (ex1 < minX) minX = ex1;
                        if (ey1 < minY) minY = ey1;
                        if (ex2 > maxX) maxX = ex2;
                        if (ey2 > maxY) maxY = ey2;
                    });

                    if (minX === Infinity) {
                        throw new Error("Canvas vide ou limite spatiale dépassée (éléments trop éloignés).");
                    }

                    const box = {
                        x: minX,
                        y: minY,
                        width: maxX - minX,
                        height: maxY - minY
                    };

                    // Apply padding
                    const padding = 50 * options.resolution; // Adjust padding based on resolution
                    const exportConfig = {
                        x: box.x - padding,
                        y: box.y - padding,
                        width: box.width + padding * 2,
                        height: box.height + padding * 2,
                        pixelRatio: options.resolution,
                        mimeType: `image/${options.format}`,
                        quality: options.quality
                    };

                    console.log("Export Box:", box);

                    // Hardware limits for canvas area usually around ~16M pixels (4096x4096) on mobile/Safari
                    // or MAX dimension 8192.
                    const MAX_PIXELS = 16_000_000;
                    let targetArea = exportConfig.width * exportConfig.height * Math.pow(exportConfig.pixelRatio, 2);

                    if (targetArea > MAX_PIXELS) {
                        // @ts-ignore: Konva config accepts number, ExportResolution is too strict here
                        exportConfig.pixelRatio = Math.sqrt(MAX_PIXELS / (exportConfig.width * exportConfig.height));
                        console.warn("Canvas area too large, downgrading pixelRatio to", exportConfig.pixelRatio);
                    }

                    // Failsafe for absurd bounds
                    if (exportConfig.pixelRatio < 0.05) {
                        // @ts-ignore
                        exportConfig.pixelRatio = 0.05;
                    }

                    console.log("Export Config:", exportConfig);

                    const dataURL = stage.toDataURL(exportConfig);
                    console.log("DataURL generated length:", dataURL.length);

                    const arr = dataURL.split(',');
                    if (arr.length < 2 || arr[1].length === 0) {
                        throw new Error(`DataURL incomplet (CORS ou dimensions excessives).`);
                    }

                    const mime = arr[0].match(/:(.*?);/)?.[1] || `image/${options.format}`;
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while (n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                    }
                    const blob = new Blob([u8arr], { type: mime });
                    const blobUrl = URL.createObjectURL(blob);

                    // Trigger download
                    const link = document.createElement('a');
                    link.download = `${title || 'scrappi_export'}.${options.format}`;
                    link.href = blobUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);

                } catch (err) {
                    console.error("Export Error:", err);
                    alert("Une erreur est survenue lors de l'exportation. Vérifiez s'il y a des images externes bloquées (CORS).");
                } finally {
                    // Restore stage state
                    if (bgRect) {
                        bgRect.destroy();
                    }
                    stage.scale({ x: oldScale, y: oldScale });
                    stage.position(oldPos);
                    stage.draw();
                    setSelectedIds(prevSelection);
                    setIsExporting(false);
                }
            }, 50);
        }
    }));

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

        // Handle multi-touch for zoom/pan
        if ('touches' in e.evt && e.evt.touches.length >= 2) {
            // Stop any drawing/selection if we start multi-touch
            setCurrentLine(null);
            setSelectionBox(null);
            return;
        }

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

        // Multi-touch handling (Pinch-to-zoom and Pan)
        if ('touches' in e.evt && e.evt.touches.length === 2) {
            e.evt.preventDefault();
            const touch1 = e.evt.touches[0];
            const touch2 = e.evt.touches[1];

            // Distance for zoom
            const dist = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            // Center point for zoom-towards-center
            const center = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };

            if (!lastTouchRef.current) {
                lastTouchRef.current = { dist, center };
                return;
            }

            const { dist: lastDist, center: lastCenter } = lastTouchRef.current;

            // Zoom logic
            const scaleBy = dist / lastDist;
            const newScale = scale * scaleBy;

            // Limit scale
            const limitedScale = Math.min(Math.max(newScale, 0.05), 10);
            setScale(limitedScale);

            // Pan logic (smooth follow fingers)
            const dx = center.x - lastCenter.x;
            const dy = center.y - lastCenter.y;

            const mousePointTo = {
                x: center.x / scale - stage.x() / scale,
                y: center.y / scale - stage.y() / scale,
            };

            setPosition({
                x: (-(mousePointTo.x - center.x / limitedScale) * limitedScale) + dx,
                y: (-(mousePointTo.y - center.y / limitedScale) * limitedScale) + dy,
            });

            // Update last values
            lastTouchRef.current = { dist, center };
            return;
        }

        if (currentLine) {
            if (currentLine.type === 'arrow') {
                const startX = currentLine.points![0];
                const startY = currentLine.points![1];
                setCurrentLine({
                    ...currentLine,
                    points: [startX, startY, pos.x, pos.y]
                });
            } else {
                // Freehand: Only add point if distance is > 3px to keep curves smooth
                const pts = currentLine.points || [];
                const lastX = pts[pts.length - 2];
                const lastY = pts[pts.length - 1];
                const dist = Math.sqrt(Math.pow(pos.x - lastX, 2) + Math.pow(pos.y - lastY, 2));

                if (dist > 3) {
                    setCurrentLine({
                        ...currentLine,
                        points: [...pts, pos.x, pos.y]
                    });
                }
            }
        } else if (selectionBox) {
            setSelectionBox({ ...selectionBox, x2: pos.x, y2: pos.y });
        }
    };

    const handleSelect = useCallback((id: string) => {
        if (activeToolRef.current === 'select') {
            const currentElements = elementsRef.current;
            const el = currentElements.find(e => e.id === id);

            if (el && el.groupId) {
                // Select all elements in this group
                const groupIds = currentElements.filter(e => e.groupId === el.groupId).map(e => e.id);
                setSelectedIds(groupIds);
            } else {
                setSelectedIds([id]);
            }
        }
    }, [setSelectedIds]);

    const handleElementChange = useCallback((id: string, newProps: Partial<CanvasElement>) => {
        console.log("CanvasStage: handleElementChange called for", id, Object.keys(newProps));
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

                updateElements(changes);
                return;
            }
        }
        updateElement(id, newProps);
    }, [updateElements, updateElement]);

    const handleMouseUp = () => {
        setGuidelines([]);
        lastTouchRef.current = null;
        if (currentLine) {
            addElement(currentLine);
            setSelectedIds([currentLine.id]);
            setCurrentLine(null);
        } else if (selectionBox) {
            // Box selection logic
            const x1 = Math.min(selectionBox.x1, selectionBox.x2);
            const y1 = Math.min(selectionBox.y1, selectionBox.y2);
            const x2 = Math.max(selectionBox.x1, selectionBox.x2);
            const y2 = Math.max(selectionBox.y1, selectionBox.y2);

            const selectedRaw = elements.filter(el => {
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

            // Expand selection to include all members of any selected group
            const expandedSelection = new Set<string>();
            selectedRaw.forEach(id => {
                const el = elements.find(e => e.id === id);
                if (el && el.groupId) {
                    elements.filter(e => e.groupId === el.groupId).forEach(groupEl => expandedSelection.add(groupEl.id));
                } else {
                    expandedSelection.add(id);
                }
            });

            setSelectedIds(Array.from(expandedSelection));
            setSelectionBox(null);
        }
    };

    const handleDragStart = useCallback((id: string, e: KonvaEventObject<DragEvent>) => {
        const currentSelected = selectedIdsRef.current;
        if (!currentSelected.includes(id)) {
            const el = elementsRef.current.find(e => e.id === id);
            if (el) {
                if (el.groupId) {
                    const groupIds = elementsRef.current
                        .filter(e => e.groupId === el.groupId)
                        .map(e => e.id);
                    setSelectedIds(groupIds);
                    selectedIdsRef.current = groupIds;
                } else {
                    setSelectedIds([id]);
                    selectedIdsRef.current = [id];
                }
            }
        }
    }, [setSelectedIds]);

    const handleDragMove = useCallback((id: string, e: KonvaEventObject<DragEvent>) => {
        if (!selectedIdsRef.current.includes(id)) return;

        const node = e.target;
        const originalData = elementsRef.current.find(el => el.id === id);
        if (!originalData) return;

        const dxRaw = node.x() - originalData.x;
        const dyRaw = node.y() - originalData.y;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedIdsRef.current.forEach(selId => {
            const el = elementsRef.current.find(e => e.id === selId);
            if (!el) return;
            const x = el.x + dxRaw;
            const y = el.y + dyRaw;
            const w = el.width || 50;
            const h = el.height || 50;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x + w > maxX) maxX = x + w;
            if (y + h > maxY) maxY = y + h;
        });
        const draggedBox = {
            minX, maxX, minY, maxY,
            centerX: minX + (maxX - minX) / 2,
            centerY: minY + (maxY - minY) / 2
        };

        const staticBoxes = elementsRef.current
            .filter(el => !selectedIdsRef.current.includes(el.id))
            .map(el => {
                const w = el.width || 50;
                const h = el.height || 50;
                return {
                    minX: el.x,
                    maxX: el.x + w,
                    minY: el.y,
                    maxY: el.y + h,
                    centerX: el.x + w / 2,
                    centerY: el.y + h / 2
                };
            });

        const { dx: snapDx, dy: snapDy, guides } = getSnappingOffset(draggedBox, staticBoxes, scale);

        const dx = dxRaw + snapDx;
        const dy = dyRaw + snapDy;

        node.position({ x: originalData.x + dx, y: originalData.y + dy });

        let hasMovedOthers = false;

        // Move other selected nodes visually
        selectedIdsRef.current.forEach(selId => {
            if (selId === id) return;
            const otherNode = nodesRef.current[selId];
            if (!otherNode) return;
            const otherOriginalData = elementsRef.current.find(el => el.id === selId);
            if (!otherOriginalData) return;

            otherNode.position({
                x: otherOriginalData.x + dx,
                y: otherOriginalData.y + dy
            });
            hasMovedOthers = true;
        });

        // Let Transformer update its bounding box to wrap the newly positioned nodes
        if (hasMovedOthers && transformerRef.current) {
            transformerRef.current.getLayer()?.batchDraw();
        }

        setGuidelines(guides);
    }, [getSnappingOffset, setGuidelines, scale]);

    const getVisibleElements = () => {
        if (isExporting) return elements;

        if (!process.env.NEXT_PUBLIC_ENABLE_CULLING) {
            // Let developers toggle if wanted, or we just force it below:
        }

        // Viewport bounds in canvas coordinates
        const vx1 = -position.x / scale;
        const vy1 = -position.y / scale;
        const vx2 = (dimensions.width - position.x) / scale;
        const vy2 = (dimensions.height - position.y) / scale;

        return elements.filter(el => {
            // Include if selected (since it has a transformer)
            if (selectedIds.includes(el.id)) return true;

            // Approximate bounding box
            const ex1 = el.x;
            const ey1 = el.y;
            const ex2 = el.x + (el.width || 0);
            const ey2 = el.y + (el.height || 0);

            // For lines/arrows, they might be large, just render them to be safe
            if (el.type === 'line' || el.type === 'arrow' || el.type === 'eraser') {
                return true;
            }

            // AABB Collision Detection with a margin
            const MARGIN = 200 / scale; // Render slightly outside screen
            return (
                ex1 < vx2 + MARGIN &&
                ex2 > vx1 - MARGIN &&
                ey1 < vy2 + MARGIN &&
                ey2 > vy1 - MARGIN
            );
        });
    };

    const visibleElements = getVisibleElements();

    // Debug: track visibility issues
    if (elements.length > 0 && visibleElements.length === 0) {
        console.warn("CANVAS EMPTY: 5 elements in store, but 0 are visible. Viewport:", {
            scale,
            posX: position.x,
            posY: position.y,
            viewportW: dimensions.width,
            viewportH: dimensions.height
        });
        if (elements[0]) console.log("Example element coords:", { x: elements[0].x, y: elements[0].y });
    }

    if (dimensions.width === 0) return null;

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden">
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
                className={`w-full h-full ${activeTool === 'draw' || activeTool === 'eraser' || activeTool === 'arrow' ? 'cursor-crosshair' : (activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')}`}
                style={{ touchAction: 'none' }}
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
                    {visibleElements.map((el) => (
                        <RenderElement
                            key={el.id}
                            element={el}
                            isSelected={selectedIds.includes(el.id)}
                            onSelect={handleSelect}
                            onChange={updateElement}
                            isDraggable={activeTool === 'select'}
                            onDragStart={handleDragStart}
                            onDragMove={handleDragMove}
                            onNodeRegister={handleNodeRegister}
                        />
                    ))}
                    {guidelines.map((guide, i) => {
                        const isV = guide.orientation === 'V';
                        return (
                            <Line
                                key={`guide-${i}`}
                                points={isV ? [guide.position, -50000, guide.position, 50000] : [-50000, guide.position, 50000, guide.position]}
                                stroke="#f87171"
                                strokeWidth={1 / scale}
                                dash={[5 / scale, 5 / scale]}
                                listening={false}
                            />
                        );
                    })}
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
                            anchorSize={12}
                            anchorCornerRadius={6}
                            borderStroke={SELECTION_STROKE_COLOR}
                            borderStrokeWidth={2}
                            padding={8}
                            rotateAnchorOffset={40}
                            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                            onTransformEnd={() => {
                                console.log("CanvasStage: Transformer.onTransformEnd fired");
                                if (!transformerRef.current) return;
                                const nodes = transformerRef.current.nodes();
                                // Update all selected elements based on their new node attributes
                                nodes.forEach((node: Konva.Node) => {
                                    if (!nodesRef.current) return;
                                    const id = Object.keys(nodesRef.current).find(key => nodesRef.current[key] === node);
                                    if (id) {
                                        const scaleX = node.scaleX();
                                        const scaleY = node.scaleY();
                                        node.scaleX(1);
                                        node.scaleY(1);

                                        console.log("CanvasStage: Updating element via transformer", id);
                                        updateElement(id, {
                                            x: node.x(),
                                            y: node.y(),
                                            width: Math.max(5, node.width() * scaleX),
                                            height: Math.max(5, node.height() * scaleY),
                                            rotation: node.rotation()
                                        });
                                    }
                                });
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
        </div >
    );
});

export default InfiniteCanvas;
