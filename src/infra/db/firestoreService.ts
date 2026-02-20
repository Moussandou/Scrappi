import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { Scrapbook, CanvasElement } from "@/domain/entities";

export const createScrapbook = async (title: string): Promise<Scrapbook> => {
    const newDocRef = doc(collection(db, "scrapbooks"));
    const now = Timestamp.now();

    const scrapbookData = {
        title,
        createdAt: now,
        updatedAt: now,
    };

    await setDoc(newDocRef, scrapbookData);

    return {
        id: newDocRef.id,
        title,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
    };
};

export const getScrapbooks = async (): Promise<Scrapbook[]> => {
    const q = query(collection(db, "scrapbooks"), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            coverImage: data.coverImage,
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
            createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString(),
        };
    } else {
        return null;
    }
};

export const saveElements = async (scrapbookId: string, elements: CanvasElement[]) => {
    const elementsRef = doc(db, "elements", scrapbookId);
    // We'll store all elements of a scrapbook in a single document for simplicity in V1
    // If the canvas gets huge, we might need a subcollection `scrapbooks/{id}/elements` instead.
    await setDoc(elementsRef, {
        elements,
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
