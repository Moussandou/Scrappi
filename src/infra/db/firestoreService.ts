import { collection, doc, setDoc, updateDoc, getDoc, getDocs, query, orderBy, serverTimestamp, Timestamp, where, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { Scrapbook, CanvasElement } from "@/domain/entities";

export const createScrapbook = async (
    userId: string,
    title: string,
    binderColor?: string,
    coverImage?: string,
    binderGrain?: number,
    coverZoom?: number,
    coverX?: number,
    coverY?: number,
    showPreview?: boolean,
    storageMode?: 'cloud' | 'local'
): Promise<Scrapbook> => {
    const newDocRef = doc(collection(db, "scrapbooks"));
    const now = Timestamp.now();
    const finalStorageMode = storageMode || 'local';

    const scrapbookData = {
        title,
        userId,
        binderColor: binderColor || "#e8e4dc",
        binderGrain: binderGrain !== undefined ? binderGrain : 0.1,
        coverImage: coverImage || null,
        coverZoom: coverZoom ?? 1,
        coverX: coverX ?? 50,
        coverY: coverY ?? 50,
        showPreview: showPreview ?? true,
        storageMode: finalStorageMode,
        createdAt: now,
        updatedAt: now,
    };

    await setDoc(newDocRef, scrapbookData);

    return {
        id: newDocRef.id,
        title,
        binderColor: scrapbookData.binderColor,
        binderGrain: scrapbookData.binderGrain,
        coverImage: scrapbookData.coverImage || undefined,
        coverZoom: scrapbookData.coverZoom,
        coverX: scrapbookData.coverX,
        coverY: scrapbookData.coverY,
        showPreview: scrapbookData.showPreview,
        storageMode: scrapbookData.storageMode as 'cloud' | 'local',
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
    };
};

export const getScrapbooks = async (userId: string): Promise<Scrapbook[]> => {
    const q = query(
        collection(db, "scrapbooks"),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            coverImage: data.coverImage,
            coverZoom: data.coverZoom ?? 1,
            coverX: data.coverX ?? 50,
            coverY: data.coverY ?? 50,
            showPreview: data.showPreview ?? true,
            binderColor: data.binderColor,
            binderGrain: data.binderGrain,
            storageMode: data.storageMode,
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
    });
};

export const getScrapbook = async (id: string): Promise<Scrapbook | null> => {
    const docRef = doc(db, "scrapbooks", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            title: data.title,
            coverImage: data.coverImage,
            coverZoom: data.coverZoom ?? 1,
            coverX: data.coverX ?? 50,
            coverY: data.coverY ?? 50,
            showPreview: data.showPreview ?? true,
            binderColor: data.binderColor,
            binderGrain: data.binderGrain,
            storageMode: data.storageMode,
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
    } else {
        return null;
    }
};

export const updateScrapbook = async (id: string, partial: Partial<Scrapbook>): Promise<void> => {
    const docRef = doc(db, "scrapbooks", id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
        ...partial,
        updatedAt: serverTimestamp(),
    };

    // Remove id from updateData to avoid writing it back
    delete updateData.id;

    // Firestore updateDoc does not support undefined values. Filter them out.
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    await updateDoc(docRef, updateData);
};

export const deleteScrapbook = async (id: string): Promise<void> => {
    // Delete the scrapbook metadata
    await deleteDoc(doc(db, "scrapbooks", id));

    // Delete elements from subcollection
    const elementsRef = collection(db, "scrapbooks", id, "elements");
    const snapshot = await getDocs(elementsRef);

    // Delete in batches of 500
    const chunkSize = 500;
    for (let i = 0; i < snapshot.docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = snapshot.docs.slice(i, i + chunkSize);
        chunk.forEach(d => batch.delete(d.ref));
        await batch.commit();
    }

    // Delete the legacy elements associated with this scrapbook if exists
    try {
        await deleteDoc(doc(db, "elements", id));
    } catch {
        // Ignore errors if document doesn't exist
    }
};


export const saveElements = async (scrapbookId: string, elements: CanvasElement[], userId: string) => {
    const subcollectionRef = collection(db, "scrapbooks", scrapbookId, "elements");

    // Get existing elements to determine what to delete
    const snapshot = await getDocs(subcollectionRef);
    const newIds = new Set(elements.map(e => e.id));

    // Prepare operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const operations: { type: 'set' | 'delete', ref: any, data?: any }[] = [];

    // Identify updates/adds
    elements.forEach(el => {
        // Sanitize and include userId for security rules
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sanitized: any = { ...el, userId };
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === undefined) {
                delete sanitized[key];
            }
        });

        operations.push({
            type: 'set',
            ref: doc(subcollectionRef, el.id),
            data: sanitized
        });
    });

    // Identify deletions
    snapshot.docs.forEach(d => {
        if (!newIds.has(d.id)) {
            operations.push({
                type: 'delete',
                ref: d.ref
            });
        }
    });

    // Execute in batches of 500
    const chunkSize = 500;
    for (let i = 0; i < operations.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = operations.slice(i, i + chunkSize);
        chunk.forEach(op => {
            if (op.type === 'set') {
                batch.set(op.ref, op.data);
            } else {
                batch.delete(op.ref);
            }
        });
        await batch.commit();
    }

    // Attempt to delete legacy document to complete migration
    try {
        await deleteDoc(doc(db, "elements", scrapbookId));
    } catch {
        // Ignore
    }
};

export const getElements = async (scrapbookId: string): Promise<CanvasElement[]> => {
    // Try to get from subcollection first
    const subcollectionRef = collection(db, "scrapbooks", scrapbookId, "elements");
    const snapshot = await getDocs(subcollectionRef);

    if (!snapshot.empty) {
        return snapshot.docs.map(d => d.data() as CanvasElement);
    }

    // Fallback to legacy document
    const elementsRef = doc(db, "elements", scrapbookId);
    const docSnap = await getDoc(elementsRef);

    if (docSnap.exists()) {
        return docSnap.data().elements || [];
    } else {
        return [];
    }
};
