import { useState } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';
import { resizeDimensions } from '../utils';
import { CanvasElement } from '@/domain/entities';

interface StorageMode {
    uploadFile: (file: File, path: string, onProgress?: (p: number) => void) => Promise<string>;
}

const DEFAULT_POSITION = { x: 0, y: 0 };

const NO_OP = () => { };

export function useMediaManager(projectId: string, storageMode: StorageMode) {
    const addElement = useCanvasStore(state => state?.addElement) || NO_OP;
    const setSelectedIds = useCanvasStore(state => state?.setSelectedIds) || NO_OP;
    const scale = useCanvasStore(state => state?.scale) ?? 1;
    const position = useCanvasStore(state => state?.position) || DEFAULT_POSITION;
    // Using useCanvasStore.getState() might be better for non-reactive reads, but this ensures reactivity when count changes.
    const elementsCount = useCanvasStore(state => state?.elements?.length) || 0;

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadLabel, setUploadLabel] = useState('');

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isStickerTrayOpen, setIsStickerTrayOpen] = useState(false);

    const handleFileSelection = async (file: File) => {
        setIsImageModalOpen(false);
        setUploading(true);
        setUploadProgress(0);
        setUploadLabel('image');
        try {
            const url = await storageMode.uploadFile(file, `projects/${projectId}`, (p) => setUploadProgress(Math.round(p)));
            const img = new window.Image();
            img.src = url;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const maxSize = 400;
            const { width: finalWidth, height: finalHeight } = resizeDimensions(img.width, img.height, maxSize);

            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const isGif = file.type === 'image/gif';
            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: isGif ? "gif" : "image",
                content: url,
                x: (x - position.x) / scale,
                y: (y - position.y) / scale,
                width: finalWidth,
                height: finalHeight,
                rotation: 0,
                zIndex: elementsCount + 1,
            };
            addElement(newElement);
            setSelectedIds([newElement.id]);
        } catch (error) {
            console.error("Failed to upload image", error);
            alert("Erreur lors de l'upload de l'image.");
        } finally {
            setUploading(false);
        }
    };

    const handleVideoSelection = async (file: File) => {
        setIsVideoModalOpen(false);
        setUploading(true);
        setUploadProgress(0);
        setUploadLabel('vidéo');
        try {
            const url = await storageMode.uploadFile(file, `projects/${projectId}/videos`, (p) => setUploadProgress(Math.round(p)));
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.preload = 'metadata';

            const metadataLoaded = new Promise((resolve) => {
                video.onloadedmetadata = () => resolve(true);
                video.onerror = () => resolve(false);
            });

            video.src = url;
            video.load();
            await metadataLoaded;

            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 360;

            const maxW = typeof window !== "undefined" ? window.innerWidth * 0.6 : 800;
            const maxH = typeof window !== "undefined" ? window.innerHeight * 0.6 : 600;

            const { width: finalWidth, height: finalHeight } = resizeDimensions(videoWidth, videoHeight, maxW, maxH);

            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "video",
                content: url,
                x: (x - position.x) / scale,
                y: (y - position.y) / scale,
                width: finalWidth,
                height: finalHeight,
                rotation: 0,
                zIndex: elementsCount + 1,
                muted: true,
                loop: true,
            };
            addElement(newElement);
            setSelectedIds([newElement.id]);
        } catch (error) {
            console.error("Failed to upload video", error);
            alert("Erreur lors de l'upload de la vidéo.");
        } finally {
            setUploading(false);
        }
    };

    const handleAddSticker = async (url: string) => {
        setUploading(true);
        try {
            const img = new window.Image();
            img.src = url;
            img.crossOrigin = "anonymous";
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const maxSize = 250;
            const { width: finalWidth, height: finalHeight } = resizeDimensions(img.width, img.height, maxSize);

            const x = typeof window !== "undefined" ? window.innerWidth / 2 : 300;
            const y = typeof window !== "undefined" ? window.innerHeight / 2 : 300;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "sticker",
                content: url,
                x: (x - position.x) / scale,
                y: (y - position.y) / scale,
                width: finalWidth,
                height: finalHeight,
                rotation: 0,
                zIndex: elementsCount + 1,
            };
            addElement(newElement);
            setSelectedIds([newElement.id]);
        } catch (error) {
            console.error("Failed to add sticker", error);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        setUploading(true);
        try {
            const url = await storageMode.uploadFile(file, `projects/${projectId}`);
            const img = new window.Image();
            img.src = url;
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const maxSize = 400;
            const { width: finalWidth, height: finalHeight } = resizeDimensions(img.width, img.height, maxSize);

            const x = (e.clientX - position.x) / scale;
            const y = (e.clientY - position.y) / scale;

            const newElement: CanvasElement = {
                id: crypto.randomUUID(),
                type: "image",
                content: url,
                x,
                y,
                width: finalWidth,
                height: finalHeight,
                rotation: 0,
                zIndex: elementsCount + 1,
            };
            addElement(newElement);
            setSelectedIds([newElement.id]);
        } catch (error) {
            console.error("Failed to upload image from drop", error);
            alert("Erreur lors de l'upload de l'image.");
        } finally {
            setUploading(false);
        }
    };

    return {
        uploading,
        uploadProgress,
        uploadLabel,
        isImageModalOpen,
        setIsImageModalOpen,
        isVideoModalOpen,
        setIsVideoModalOpen,
        isStickerTrayOpen,
        setIsStickerTrayOpen,
        handleFileSelection,
        handleVideoSelection,
        handleAddSticker,
        handleDrop
    };
}
