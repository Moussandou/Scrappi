/**
 * Local storage service using the File System Access API.
 * Allows users to store media files directly on their PC
 * instead of uploading to Firebase Storage.
 *
 * The directory handle is persisted in IndexedDB so it survives
 * page reloads (permission re-grant is still required each session).
 */

// TypeScript declarations for File System Access API (Chromium only)
declare global {
    interface Window {
        showDirectoryPicker(options?: { mode?: "read" | "readwrite" }): Promise<FileSystemDirectoryHandle>;
    }
    interface FileSystemDirectoryHandle {
        queryPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
        requestPermission(descriptor?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
    }
}

const DB_NAME = "scrappi-local-storage";
const STORE_NAME = "handles";
const DIR_KEY = "rootDirectory";

// Blob URL cache to avoid re-resolving on every render
const blobUrlCache = new Map<string, string>();

// ---- IndexedDB helpers for handle persistence ----

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(handle, DIR_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).get(DIR_KEY);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
    });
}

async function clearHandle(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(DIR_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ---- Directory handle state ----

let currentDirHandle: FileSystemDirectoryHandle | null = null;

/**
 * Prompt the user to pick a directory for local storage.
 * Persists the handle in IndexedDB.
 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    currentDirHandle = handle;
    await saveHandle(handle);
    return handle;
}

/**
 * Restore a previously picked directory from IndexedDB.
 * Requests permission if needed. Returns null if no directory was saved
 * or if the user denies the permission prompt.
 */
export async function restoreDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (currentDirHandle) return currentDirHandle;

    const handle = await loadHandle();
    if (!handle) return null;

    // Verify we still have permission
    const permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission === "granted") {
        currentDirHandle = handle;
        return handle;
    }

    // Request permission (requires user gesture context)
    try {
        const requested = await handle.requestPermission({ mode: "readwrite" });
        if (requested === "granted") {
            currentDirHandle = handle;
            return handle;
        }
    } catch {
        // User denied or API not available
    }

    return null;
}

/**
 * Check if a local directory is linked (without requesting permission).
 */
export async function hasLocalDirectory(): Promise<boolean> {
    const handle = await loadHandle();
    if (!handle) return false;
    const permission = await handle.queryPermission({ mode: "readwrite" });
    return permission === "granted";
}

/**
 * Get the name of the currently linked directory.
 */
export function getDirectoryName(): string | null {
    return currentDirHandle?.name ?? null;
}

/**
 * Save a file to the local directory.
 * Creates subdirectories as needed (e.g., "images", "videos").
 * Returns a `local:{filename}` reference to store in the element.
 */
export async function saveFileLocally(
    file: File,
    subdirectory: string = "media",
    onProgress?: (progress: number) => void
): Promise<string> {
    const dir = currentDirHandle;
    if (!dir) throw new Error("No local directory selected");

    // Create subdirectory if needed
    const subDir = await dir.getDirectoryHandle(subdirectory, { create: true });

    // Generate unique filename
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;
    const fileHandle = await subDir.getFileHandle(filename, { create: true });

    // Write the file
    const writable = await fileHandle.createWritable();
    const reader = file.stream().getReader();
    const totalSize = file.size;
    let written = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writable.write(value);
        written += value.byteLength;
        if (onProgress) {
            onProgress(Math.round((written / totalSize) * 100));
        }
    }

    await writable.close();

    // Return a local reference: local:subdirectory/filename
    return `local:${subdirectory}/${filename}`;
}

/**
 * Resolve a `local:path` reference to a blob URL for rendering.
 * Caches blob URLs to avoid re-resolving on every render.
 */
export async function resolveLocalUrl(localRef: string): Promise<string> {
    // Check cache first
    const cached = blobUrlCache.get(localRef);
    if (cached) return cached;

    const dir = currentDirHandle;
    if (!dir) throw new Error("No local directory selected");

    // Parse the reference: "local:subdirectory/filename"
    const path = localRef.replace("local:", "");
    const parts = path.split("/");
    const filename = parts.pop()!;
    const subdirectory = parts.join("/");

    // Navigate to subdirectory
    let targetDir: FileSystemDirectoryHandle = dir;
    if (subdirectory) {
        for (const part of subdirectory.split("/")) {
            targetDir = await targetDir.getDirectoryHandle(part);
        }
    }

    // Get the file and create a blob URL
    const fileHandle = await targetDir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const blobUrl = URL.createObjectURL(file);

    // Cache it
    blobUrlCache.set(localRef, blobUrl);
    return blobUrl;
}

/**
 * Check if a source string is a local file reference.
 */
export function isLocalRef(src: string): boolean {
    return src.startsWith("local:");
}

/**
 * Revoke all cached blob URLs to free memory.
 */
export function revokeAllBlobUrls(): void {
    for (const url of blobUrlCache.values()) {
        URL.revokeObjectURL(url);
    }
    blobUrlCache.clear();
}

/**
 * Disconnect the local directory (clear IndexedDB handle).
 */
export async function disconnectDirectory(): Promise<void> {
    revokeAllBlobUrls();
    currentDirHandle = null;
    await clearHandle();
}

/**
 * Check if the File System Access API is supported.
 */
export function isFileSystemAccessSupported(): boolean {
    return typeof window !== "undefined" && "showDirectoryPicker" in window;
}
