"use client";

import { useAuth } from "@/infra/auth/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import MainHeader from "@/ui/layout/MainHeader";
import Link from "next/link";
import { getUserSettings, updateUserSettings } from "@/infra/db/firestoreService";

export default function ProfilePage() {
    const { user, loading, deleteAccount, updateProfileInfo } = useAuth();
    const router = useRouter();

    // Account deletion state
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Profile editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || "");
    const [isSavingName, setIsSavingName] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        defaultStorageMode: 'local',
        autoSave: true,
        theme: 'light'
    });
    // Removed unused isSettingsLoading

    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        if (!user) return;
        try {
            const fetched = await getUserSettings(user.uid);
            if (fetched) setSettings(fetched as { defaultStorageMode: string; autoSave: boolean; theme: string });
        } catch {
            // Error logged in loadSettings if needed
        }
    }, [user]);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (user) {
            setNewName(user.displayName || "");
            loadSettings();
        }
    }, [user, loading, router, loadSettings]);

    const handleUpdateSettings = async (updates: any) => {
        if (!user) return;
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        try {
            await updateUserSettings(user.uid, newSettings);
        } catch {
            // Error handled silently or logged if needed
            setError("Erreur lors de la mise à jour des paramètres.");
        }
    };

    const handleSaveName = async () => {
        if (!newName.trim() || newName === user?.displayName) {
            setIsEditingName(false);
            return;
        }
        setIsSavingName(true);
        setError(null);
        try {
            await updateProfileInfo(newName);
            setSuccessMsg("Nom d'affichage mis à jour !");
            setIsEditingName(false);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError("Erreur lors de la mise à jour du nom.");
        } finally {
            setIsSavingName(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await deleteAccount();
            router.push("/");
        } catch (err: unknown) {
            const error = err as { message?: string };
            console.error("Deletion error:", err);
            if (error.message === "REAUTH_REQUIRED") {
                setError("Pour supprimer votre compte, vous devez vous reconnecter récemment. Veuillez vous déconnecter et vous reconnecter, puis réessayez.");
            } else {
                setError("Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.");
            }
            setIsDeleting(false);
            setShowConfirm(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center font-serif italic text-ink-light">
                Chargement...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper relative overflow-hidden font-sans">
            {/* Background Texture & Grid */}
            <div className="fixed inset-0 pointer-events-none opacity-40 z-0 sketchbook-grid"></div>

            <MainHeader />

            <main className="relative z-20 max-w-3xl mx-auto px-6 py-12 md:py-20">
                <div className="mb-12">
                    <Link href="/library" className="inline-flex items-center gap-2 text-ink-light hover:text-ink transition-colors group mb-8">
                        <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">arrow_back</span>
                        <span className="text-sm font-medium">Retour à la bibliothèque</span>
                    </Link>

                    <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink mb-2">Mon Profil</h1>
                    <p className="text-ink-light font-medium tracking-wide border-b border-paper-dark pb-4">Configurez votre atelier et gérez votre compte</p>
                </div>

                <div className="space-y-8">
                    {/* User Info Card */}
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-black/5 shadow-soft">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                <Image
                                    src={user.photoURL || "/default-avatar.png"}
                                    alt={user.displayName || "User"}
                                    width={128}
                                    height={128}
                                    className="size-32 rounded-full border-4 border-white shadow-lg object-cover"
                                    unoptimized
                                />
                                <div className="absolute inset-0 rounded-full bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                {isEditingName ? (
                                    <div className="flex flex-col items-center md:items-start gap-2">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="text-2xl font-bold text-ink bg-white/80 border-b-2 border-sage outline-none px-2 rounded-t-lg w-full max-w-xs"
                                            autoFocus
                                            maxLength={30}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveName}
                                                disabled={isSavingName}
                                                className="text-xs font-bold bg-sage text-white px-3 py-1 rounded-full hover:bg-sage/90 transition-colors"
                                            >
                                                Sauvegarder
                                            </button>
                                            <button
                                                onClick={() => { setIsEditingName(false); setNewName(user.displayName || ""); }}
                                                className="text-xs font-bold bg-paper-dark text-ink-light px-3 py-1 rounded-full hover:bg-paper-dark/80 transition-colors"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center md:items-start group/name">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-2xl font-bold text-ink mb-1">{user.displayName || "Artiste Scrappi"}</h2>
                                            <button
                                                onClick={() => setIsEditingName(true)}
                                                className="opacity-0 group-hover/name:opacity-100 text-ink-light hover:text-sage transition-all p-1"
                                                title="Modifier le nom"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                        </div>
                                        <p className="text-ink-light font-medium mb-4">{user.email}</p>
                                    </div>
                                )}

                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage/10 text-sage rounded-full text-xs font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                    Compte Connecté
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Success Message toast-like */}
                    {successMsg && (
                        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-sage text-white px-6 py-3 rounded-full shadow-xl font-bold z-50 animate-in fade-in slide-in-from-bottom-4">
                            {successMsg}
                        </div>
                    )}

                    {/* App Settings Section */}
                    <div className="section-card bg-white/40 rounded-4xl p-8 border border-black/5">
                        <h3 className="text-lg font-serif font-bold text-ink mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sage">settings</span>
                            Préférences de l&apos;Atelier
                        </h3>

                        <div className="space-y-6">
                            {/* Auto-save toggle */}
                            <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/[0.03]">
                                <div>
                                    <h4 className="font-bold text-ink">Sauvegarde automatique</h4>
                                    <p className="text-sm text-ink-light">Enregistrer vos créations en temps réel pendant l&apos;édition.</p>
                                </div>
                                <button
                                    onClick={() => handleUpdateSettings({ autoSave: !settings.autoSave })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoSave ? 'bg-sage' : 'bg-paper-dark'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoSave ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* Storage Mode preference */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-ink">Stockage par défaut</h4>
                                    <p className="text-sm text-ink-light">Méthode d&apos;enregistrement par défaut pour les nouveaux classeurs.</p>
                                </div>
                                <div className="flex p-1 bg-paper rounded-2xl border border-black/5">
                                    <button
                                        onClick={() => handleUpdateSettings({ defaultStorageMode: 'local' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${settings.defaultStorageMode === 'local' ? 'bg-white text-sage shadow-soft' : 'text-ink-light hover:text-ink'}`}
                                    >
                                        Local
                                    </button>
                                    <button
                                        onClick={() => handleUpdateSettings({ defaultStorageMode: 'cloud' })}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${settings.defaultStorageMode === 'cloud' ? 'bg-white text-sage shadow-soft' : 'text-ink-light hover:text-ink'}`}
                                    >
                                        Cloud
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-16 pt-8 border-t-2 border-dashed border-paper-dark">
                        <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2 px-2">
                            <span className="material-symbols-outlined">warning</span>
                            Zone de danger
                        </h3>

                        <div className="bg-red-50/30 rounded-3xl p-8 border border-red-100 shadow-sm relative overflow-hidden">
                            <h4 className="text-lg font-bold text-ink mb-2">Supprimer mon compte</h4>
                            <p className="text-sm text-ink-light mb-6">
                                Cette action est définitive. Tous vos classeurs, stickers, et éléments de l&apos;atelier seront supprimés sans possibilité de récupération.
                            </p>

                            {!showConfirm ? (
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-full text-sm font-bold shadow-sm hover:bg-red-50 hover:border-red-300 transition-all active:scale-95"
                                >
                                    Supprimer définitivement
                                </button>
                            ) : (
                                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="text-xs font-bold text-red-700 uppercase tracking-tighter">Êtes-vous sûr ? C&apos;est votre dernière chance.</p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={handleDeleteAccount}
                                            disabled={isDeleting}
                                            className="px-6 py-3 bg-red-600 text-white rounded-full text-sm font-bold shadow-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                                    Suppression...
                                                </>
                                            ) : (
                                                "Oui, supprimer tout"
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setShowConfirm(false)}
                                            disabled={isDeleting}
                                            className="px-6 py-3 bg-paper border border-black/10 text-ink rounded-full text-sm font-bold hover:bg-white transition-all disabled:opacity-50"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-6 p-4 bg-red-100/80 text-red-800 text-sm rounded-2xl border border-red-200">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
