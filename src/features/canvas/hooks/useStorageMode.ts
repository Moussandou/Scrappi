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
    disconnectDirectory,
    revokeAllBlobUrls,
} from "@/infra/storage/localStorageService";

type StorageMode = "cloud" | "local";

const STORAGE_MODE_KEY = "scrappi-storage-mode";

export interface UseStorageModeReturn {
    mode: StorageMode;
    isLocalSupported: boolean;
    directoryName: string | null;
    directoryReady: boolean;
    setMode: (mode: StorageMode) => Promise<void>;
    changeDirectory: () => Promise<void>;
    uploadFile: (file: File, directory: string, onProgress?: (p: number) => void) => Promise<string>;
    resolveUrl: (src: string) => Promise<string>;
    disconnect: () => Promise<void>;
}

export function useStorageMode(): UseStorageModeReturn {
    const [mode, setModeState] = useState<StorageMode>("cloud");
    const [directoryName, setDirectoryName] = useState<string | null>(null);
    const [directoryReady, setDirectoryReady] = useState(false);

    // Check support only on client side to avoid hydration mismatch
    const [isLocalSupported, setIsLocalSupported] = useState(false);

    useEffect(() => {
        setIsLocalSupported(isFileSystemAccessSupported());
    }, []);

    // Cache for resolved URLs within this hook instance
    const resolvedCache = useRef(new Map<string, string>());

    // Restore saved mode and directory handle on mount
    useEffect(() => {
        if (!isLocalSupported) return;

        const savedMode = localStorage.getItem(STORAGE_MODE_KEY) as StorageMode | null;
        if (savedMode === "local") {
            setModeState("local");
            restoreDirectory().then(handle => {
                if (handle) {
                    setDirectoryName(handle.name);
                    setDirectoryReady(true);
                } else {
                    // Handle lost or permission denied
                    setDirectoryReady(false);
                }
            });
        }

        return () => revokeAllBlobUrls();
    }, [isLocalSupported]);

    const setMode = useCallback(async (newMode: StorageMode) => {
        if (newMode === "local") {
            if (!isLocalSupported) {
                alert("Votre navigateur ne supporte pas l'API File System Access.");
                return;
            }

            // Try to restore existing handle first
            let handle = await restoreDirectory();

            // If no handle or permission denied, ask user to pick
            if (!handle) {
                try {
                    handle = await pickDirectory();
                } catch (e) {
                    // User cancelled
                    console.log("Selection cancelled");
                    return;
                }
            }

            if (handle) {
                setDirectoryName(handle.name);
                setDirectoryReady(true);
                setModeState("local");
                localStorage.setItem(STORAGE_MODE_KEY, "local");
            }
        } else {
            setModeState("cloud");
            localStorage.setItem(STORAGE_MODE_KEY, "cloud");
        }
    }, [isLocalSupported]);

    const changeDirectory = useCallback(async () => {
        if (!isLocalSupported) return;
        try {
            const handle = await pickDirectory();
            setDirectoryName(handle.name);
            setDirectoryReady(true);

            // Also ensure we switch to local mode
            if (mode !== "local") {
                setModeState("local");
                localStorage.setItem(STORAGE_MODE_KEY, "local");
            }
        } catch (e) {
            console.log("Directory change cancelled");
        }
    }, [isLocalSupported, mode]);

    const uploadFile = useCallback(async (
        file: File,
        directory: string,
        onProgress?: (p: number) => void
    ): Promise<string> => {
        if (mode === "local") {
            if (!directoryReady) {
                // Try to restore permission on the fly (requires user gesture usually)
                const handle = await restoreDirectory();
                if (handle) {
                    setDirectoryReady(true);
                    setDirectoryName(handle.name);
                } else {
                    // If still not ready, prompt for directory
                    try {
                        const newHandle = await pickDirectory();
                        setDirectoryReady(true);
                        setDirectoryName(newHandle.name);
                    } catch {
                        throw new Error("Dossier local non accessible. Veuillez en sélectionner un.");
                    }
                }
            }
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
            return ""; // Return empty or placeholder?
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
        changeDirectory,
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
