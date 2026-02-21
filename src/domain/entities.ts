/**
 * This file serves as a placeholder for implementing domain logic.
 * The domain layer should contain business rules, interfaces/types that are
 * independent of the framework (UI) or infrastructure.
 */

export interface Scrapbook {
    id: string;
    title: string;
    coverImage?: string;
    coverZoom?: number;
    coverX?: number;
    coverY?: number;
    binderColor?: string;
    binderGrain?: number;
    createdAt: string;
    updatedAt: string;
}

export type CanvasElementType = 'text' | 'image' | 'video' | 'sticker' | 'line' | 'arrow' | 'eraser' | 'hand';

export interface CanvasElement {
    id: string;
    type: CanvasElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    zIndex: number;
    backgroundColor?: string;
    content: string; // URL for images/videos/stickers or raw text
    points?: number[]; // For drawings
    strokeColor?: string;
    strokeWidth?: number;
}

export interface CanvasPage {
    id: string;
    scrapbookId: string;
    elements: CanvasElement[];
    createdAt: string;
    updatedAt: string;
}
