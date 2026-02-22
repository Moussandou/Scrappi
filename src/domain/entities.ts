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
    showPreview?: boolean;
    backgroundColor?: string;
    paperType?: string;
    storageMode?: 'cloud' | 'local';
    createdAt: string;
    updatedAt: string;
}

export interface ScrapbookConfig {
    title: string;
    binderColor: string;
    coverImage?: string | null;
    binderGrain?: number;
    coverZoom?: number;
    coverX?: number;
    coverY?: number;
    showPreview?: boolean;
    storageMode?: 'cloud' | 'local';
}

export type CanvasElementType = 'text' | 'image' | 'video' | 'gif' | 'sticker' | 'line' | 'arrow' | 'eraser' | 'hand';

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
    fontFamily?: string;
    // Video properties
    muted?: boolean;
    loop?: boolean;
    volume?: number;
    autoPlay?: boolean;
}

export interface CanvasPage {
    id: string;
    scrapbookId: string;
    elements: CanvasElement[];
    createdAt: string;
    updatedAt: string;
}
