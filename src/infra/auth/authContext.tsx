"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "@/infra/db/firebase";
import { db } from "@/infra/db/firebase";
import { deleteUserData, updateUserProfile } from "@/infra/db/firestoreService";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    deleteAccount: () => Promise<void>;
    updateProfileInfo: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Save user profile to Firestore on each login
async function syncUserProfile(user: User) {
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, {
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        lastLoginAt: serverTimestamp(),
    }, { merge: true });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(!!auth);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("Auth state change:", firebaseUser ? `User ${firebaseUser.email} logged in` : "User logged out");
            setUser(firebaseUser);
            if (firebaseUser) {
                const tokenResult = await firebaseUser.getIdTokenResult();
                setIsAdmin(tokenResult.claims.admin === true);
                syncUserProfile(firebaseUser).catch(e =>
                    console.warn("Profile sync failed:", e)
                );
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        if (!auth) throw new Error("Firebase Auth is not initialized.");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });

        try {
            console.log("Attempting Google Login (Popup)...");
            const result = await signInWithPopup(auth, provider);
            console.log("Google Login success:", result.user.email);
        } catch (error: unknown) {
            const firebaseError = error as { code?: string; message?: string };
            console.error("Google Login failure:", firebaseError.code, firebaseError.message);
            if (firebaseError.code === 'auth/popup-blocked') {
                throw new Error("Le bloqueur de fenêtres empêche la connexion Google. Veuillez l'autoriser.");
            }
            throw error;
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        if (!auth) throw new Error("Firebase Auth is not initialized.");
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Email login failed:", error);
            throw error;
        }
    };

    const registerWithEmail = async (email: string, password: string) => {
        if (!auth) throw new Error("Firebase Auth is not initialized.");
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Email registration failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const deleteAccount = async () => {
        if (!user) return;

        try {
            // 1. Delete Firestore data first while authenticated
            await deleteUserData(user.uid);

            // 2. Delete the Firebase Auth account
            await user.delete();

            // Note: Firebase delete() automatically signs out on success
        } catch (error: unknown) {
            const firebaseError = error as { code?: string; message?: string };
            console.error("Account deletion failed:", firebaseError);
            if (firebaseError.code === 'auth/requires-recent-login') {
                throw new Error("REAUTH_REQUIRED");
            }
            throw error;
        }
    };

    const updateProfileInfo = async (displayName: string) => {
        if (!user) return;
        try {
            await updateProfile(user, { displayName });
            // Sync to Firestore
            await updateUserProfile(user.uid, { displayName });
            // The Firebase User object is updated automatically in onAuthStateChanged
        } catch (error) {
            console.error("Profile update failed:", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isAdmin,
            loginWithGoogle,
            loginWithEmail,
            registerWithEmail,
            logout,
            deleteAccount,
            updateProfileInfo
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
