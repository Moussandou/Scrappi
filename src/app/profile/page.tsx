"use client";

import { useAuth } from "@/infra/auth/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MainHeader from "@/ui/layout/MainHeader";
import Link from "next/link";

export default function ProfilePage() {
    const { user, loading, deleteAccount } = useAuth();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await deleteAccount();
            router.push("/");
        } catch (err: any) {
            console.error("Deletion error:", err);
            if (err.message === "REAUTH_REQUIRED") {
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
                    <p className="text-ink-light font-medium tracking-wide border-b border-paper-dark pb-4">Gérez vos informations et votre compte Scrappi</p>
                </div>

                <div className="space-y-8">
                    {/* User Info Card */}
                    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-black/5 shadow-soft">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative group">
                                <img
                                    src={user.photoURL || ""}
                                    alt={user.displayName || "User"}
                                    className="size-32 rounded-full border-4 border-white shadow-lg object-cover"
                                />
                                <div className="absolute inset-0 rounded-full bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-2xl font-bold text-ink mb-1">{user.displayName}</h2>
                                <p className="text-ink-light font-medium mb-4">{user.email}</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage/10 text-sage rounded-full text-xs font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                    Compte Google Connecté
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preferences / Stats (Placeholder for future) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/40 rounded-3xl p-6 border border-black/5">
                            <h3 className="text-sm font-bold text-ink-light uppercase tracking-wider mb-2">Statut</h3>
                            <p className="text-ink font-medium">Membre depuis le test</p>
                        </div>
                        <div className="bg-white/40 rounded-3xl p-6 border border-black/5">
                            <h3 className="text-sm font-bold text-ink-light uppercase tracking-wider mb-2">Langue</h3>
                            <p className="text-ink font-medium">Français (Auto)</p>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-16 pt-8 border-t-2 border-dashed border-paper-dark">
                        <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">warning</span>
                            Zone de danger
                        </h3>

                        <div className="bg-red-50/30 rounded-3xl p-8 border border-red-100 shadow-sm relative overflow-hidden">
                            <h4 className="text-lg font-bold text-ink mb-2">Supprimer mon compte</h4>
                            <p className="text-sm text-ink-light mb-6">
                                Cette action est définitive. Tous vos classeurs, stickers, et éléments de l'atelier seront supprimés sans possibilité de récupération.
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
                                    <p className="text-xs font-bold text-red-700 uppercase tracking-tighter">Êtes-vous sûr ? C'est votre dernière chance.</p>
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
