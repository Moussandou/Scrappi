import {
    collection, getDocs, getDoc, setDoc, deleteDoc, doc, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { Scrapbook, CanvasElement } from "@/domain/entities";

export interface AdminUser {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    scrapbookCount: number;
    latestActivity: string;
}

interface UserProfile {
    email?: string;
    displayName?: string;
    photoURL?: string;
    lastLoginAt?: { toDate: () => Date };
}

// Fetch all scrapbooks across all users (admin only)
export const getAllScrapbooks = async (): Promise<(Scrapbook & { userId: string })[]> => {
    const q = query(collection(db, "scrapbooks"), orderBy("updatedAt", "desc"));
    const snap = await getDocs(q);

    return snap.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
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
            userId: data.userId || "",
        };
    });
};

// Fetch all user profiles from Firestore
export const getAllUserProfiles = async (): Promise<Map<string, UserProfile>> => {
    const snap = await getDocs(collection(db, "users"));
    const profiles = new Map<string, UserProfile>();
    snap.docs.forEach(d => {
        profiles.set(d.id, d.data() as UserProfile);
    });
    return profiles;
};

// Aggregate users from scrapbook data + profiles
export const aggregateUsers = (
    scrapbooks: (Scrapbook & { userId: string })[],
    profiles: Map<string, UserProfile>
): AdminUser[] => {
    const userMap = new Map<string, AdminUser>();

    for (const sb of scrapbooks) {
        if (!sb.userId) continue;
        const existing = userMap.get(sb.userId);
        if (existing) {
            existing.scrapbookCount++;
            if (sb.updatedAt > existing.latestActivity) {
                existing.latestActivity = sb.updatedAt;
            }
        } else {
            const profile = profiles.get(sb.userId);
            userMap.set(sb.userId, {
                uid: sb.userId,
                email: profile?.email || "",
                displayName: profile?.displayName || "",
                photoURL: profile?.photoURL || "",
                scrapbookCount: 1,
                latestActivity: sb.updatedAt,
            });
        }
    }

    // Add users who have profiles but no scrapbooks
    for (const [uid, profile] of profiles) {
        if (!userMap.has(uid)) {
            userMap.set(uid, {
                uid,
                email: profile.email || "",
                displayName: profile.displayName || "",
                photoURL: profile.photoURL || "",
                scrapbookCount: 0,
                latestActivity: profile.lastLoginAt?.toDate().toISOString() || "",
            });
        }
    }

    return Array.from(userMap.values());
};

// Read-only fetch of any scrapbook's elements (admin only)
export const getAnyElements = async (scrapbookId: string): Promise<CanvasElement[]> => {
    const ref = doc(db, "elements", scrapbookId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
        return snap.data().elements || [];
    }
    return [];
};

// Admin delete of any scrapbook
export const deleteAnyScrapbook = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "scrapbooks", id));
    try {
        await deleteDoc(doc(db, "elements", id));
    } catch {
        // Elements doc may not exist
    }
};

// Maintenance mode
export const setMaintenanceMode = async (enabled: boolean, message?: string): Promise<void> => {
    const ref = doc(db, "config", "maintenance");
    await setDoc(ref, {
        enabled,
        message: message || "L'application est en cours de maintenance. Veuillez réessayer plus tard.",
        updatedAt: serverTimestamp(),
    });
};

export const getMaintenanceStatus = async (): Promise<{ enabled: boolean; message: string }> => {
    const ref = doc(db, "config", "maintenance");
    const snap = await getDoc(ref);
    if (snap.exists()) {
        const data = snap.data();
        return {
            enabled: data.enabled ?? false,
            message: data.message || "",
        };
    }
    return { enabled: false, message: "" };
};
