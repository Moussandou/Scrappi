"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { uploadImage } from "@/infra/db/storageService";
import {
    isFileSystemAccessSupported,
    pickDirectory,
    restoreDirectory,
    saveFileLocally,
    resolveLocalUrl,
    isLocalRef,
    getDirectoryName,
    disconnectDirectory,
    revokeAllBlobUrls,
} from "@/infra/storage/localStorageService";

type StorageMode = "cloud" | "local";

const STORAGE_MODE_KEY = "scrappi-storage-mode";

interface UseStorageModeReturn {
    mode: StorageMode;
    isLocalSupported: boolean;
    directoryName: string | null;
    directoryReady: boolean;
    setMode: (mode: StorageMode) => Promise<void>;
    uploadFile: (file: File, directory: string, onProgress?: (p: number) => void) => Promise<string>;
    resolveUrl: (src: string) => Promise<string>;
    disconnect: () => Promise<void>;
}

export function useStorageMode(): UseStorageModeReturn {
    const [mode, setModeState] = useState<StorageMode>("cloud");
    const [directoryName, setDirectoryName] = useState<string | null>(null);
    const [directoryReady, setDirectoryReady] = useState(false);
    const isLocalSupported = isFileSystemAccessSupported();

    // Cache for resolved URLs within this hook instance
    const resolvedCache = useRef(new Map<string, string>());

    // Restore saved mode and directory handle on mount
    useEffect(() => {
        const savedMode = localStorage.getItem(STORAGE_MODE_KEY) as StorageMode | null;
        if (savedMode === "local" && isLocalSupported) {
            setModeState("local");
            restoreDirectory().then(handle => {
                if (handle) {
                    setDirectoryName(handle.name);
                    setDirectoryReady(true);
                }
            });
        }

        return () => revokeAllBlobUrls();
    }, [isLocalSupported]);

    const setMode = useCallback(async (newMode: StorageMode) => {
        if (newMode === "local") {
            if (!isLocalSupported) {
                throw new Error("File System Access API not supported in this browser");
            }
            const handle = await pickDirectory();
            setDirectoryName(handle.name);
            setDirectoryReady(true);
        } else {
            setDirectoryReady(false);
            setDirectoryName(null);
        }
        setModeState(newMode);
        localStorage.setItem(STORAGE_MODE_KEY, newMode);
    }, [isLocalSupported]);

    const uploadFile = useCallback(async (
        file: File,
        directory: string,
        onProgress?: (p: number) => void
    ): Promise<string> => {
        if (mode === "local" && directoryReady) {
            return saveFileLocally(file, directory, onProgress);
        }
        // Fallback to cloud
        return uploadImage(file, directory, onProgress);
    }, [mode, directoryReady]);

    const resolveUrl = useCallback(async (src: string): Promise<string> => {
        if (!src) return "";
        if (!isLocalRef(src)) return src;

        // Check hook-level cache
        const cached = resolvedCache.current.get(src);
        if (cached) return cached;

        try {
            const blobUrl = await resolveLocalUrl(src);
            resolvedCache.current.set(src, blobUrl);
            return blobUrl;
        } catch (error) {
            console.warn("Failed to resolve local file:", src, error);
            return "";
        }
    }, []);

    const disconnect = useCallback(async () => {
        await disconnectDirectory();
        setModeState("cloud");
        setDirectoryName(null);
        setDirectoryReady(false);
        localStorage.setItem(STORAGE_MODE_KEY, "cloud");
        resolvedCache.current.clear();
    }, []);

    return {
        mode,
        isLocalSupported,
        directoryName,
        directoryReady,
        setMode,
        uploadFile,
        resolveUrl,
        disconnect,
    };
}

/**
 * Convenience: get the display label for the current mode.
 */
export function getStorageModeLabel(mode: StorageMode): string {
    return mode === "local" ? "Stockage local" : "Stockage cloud";
}
