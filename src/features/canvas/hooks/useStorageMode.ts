"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

type StorageMode = "local";

export interface UseStorageModeReturn {
    mode: StorageMode;
    isLocalSupported: boolean;
    directoryName: string | null;
    directoryReady: boolean;
    isInitializing: boolean;
    setMode: (mode: StorageMode) => Promise<void>;
    changeDirectory: () => Promise<void>;
    uploadFile: (file: File, directory: string, onProgress?: (p: number) => void) => Promise<string>;
    resolveUrl: (src: string) => Promise<string>;
    disconnect: () => Promise<void>;
}

export function useStorageMode(): UseStorageModeReturn {
    const [mode, setModeState] = useState<StorageMode>("local");
    const [directoryName, setDirectoryName] = useState<string | null>(null);
    const [directoryReady, setDirectoryReady] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);

    // Check support only on client side to avoid hydration mismatch
    const [isLocalSupported, setIsLocalSupported] = useState(false);

    useEffect(() => {
        // We defer this call or use a ref-like approach if we really want to avoid the warning,
        // but since it's a mount-only check, using a microtask or just moving it is better.
        const checkSupport = () => {
            setIsLocalSupported(isFileSystemAccessSupported());
        };
        checkSupport();
    }, []);

    // Cache for resolved URLs within this hook instance
    const resolvedCache = useRef(new Map<string, string>());

    // Restore saved directory handle on mount
    useEffect(() => {
        if (!isLocalSupported) {
            setIsInitializing(false);
            return;
        }

        restoreDirectory().then(handle => {
            if (handle) {
                setDirectoryName(handle.name);
                setDirectoryReady(true);
            }
        }).finally(() => {
            setIsInitializing(false);
        });

        return () => revokeAllBlobUrls();
    }, [isLocalSupported]);

    const setMode = useCallback(async (newMode: StorageMode) => {
        // Enforce local
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
            } catch {
                // User cancelled
                console.log("Selection cancelled");
                return;
            }
        }

        if (handle) {
            setDirectoryName(handle.name);
            setDirectoryReady(true);
            setModeState("local");
        }
    }, [isLocalSupported]);

    const changeDirectory = useCallback(async () => {
        if (!isLocalSupported) return;
        try {
            const handle = await pickDirectory();
            setDirectoryName(handle.name);
            setDirectoryReady(true);
        } catch (_e) {
            console.log("Directory change cancelled");
        }
    }, [isLocalSupported, mode]);

    const uploadFile = useCallback(async (
        file: File,
        directory: string,
        onProgress?: (p: number) => void
    ): Promise<string> => {
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
    }, [directoryReady]);

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
        setModeState("local");
        setDirectoryName(null);
        setDirectoryReady(false);
        resolvedCache.current.clear();
    }, []);

    return {
        mode,
        isLocalSupported,
        directoryName,
        directoryReady,
        isInitializing,
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
    return "Stockage local";
}

