import { collection, doc, setDoc, updateDoc, getDoc, getDocs, query, orderBy, serverTimestamp, Timestamp, where, deleteDoc } from "firebase/firestore";
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
    showPreview?: boolean
): Promise<Scrapbook> => {
    const newDocRef = doc(collection(db, "scrapbooks"));
    const now = Timestamp.now();

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

    // Delete the elements associated with this scrapbook
    await deleteDoc(doc(db, "elements", id));
};


export const saveElements = async (scrapbookId: string, elements: CanvasElement[], userId: string) => {
    const elementsRef = doc(db, "elements", scrapbookId);
    // We'll store all elements of a scrapbook in a single document for simplicity in V1
    // If the canvas gets huge, we might need a subcollection `scrapbooks/{id}/elements` instead.

    // Firestore does not support undefined values. We must strip them.
    const sanitizedElements = elements.map(el => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sanitized: any = { ...el };
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === undefined) {
                delete sanitized[key];
            }
        });
        return sanitized;
    });

    await setDoc(elementsRef, {
        elements: sanitizedElements,
        userId,
        updatedAt: serverTimestamp(),
    });
};

export const getElements = async (scrapbookId: string): Promise<CanvasElement[]> => {
    const elementsRef = doc(db, "elements", scrapbookId);
    const docSnap = await getDoc(elementsRef);

    if (docSnap.exists()) {
        return docSnap.data().elements || [];
    } else {
        return [];
    }
};
