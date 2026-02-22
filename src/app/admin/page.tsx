"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/infra/auth/authContext";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/infra/db/firebase";
import Link from "next/link";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({
        scrapbooksCount: 0,
        estimatedReads: 0,
        loading: true
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        const fetchStats = async () => {
            try {
                // Approximate counts by querying collections
                const scrapbooksSnap = await getDocs(collection(db, "scrapbooks"));
                setStats({
                    scrapbooksCount: scrapbooksSnap.size,
                    estimatedReads: scrapbooksSnap.size * 2, // Simple estimate
                    loading: false
                });
            } catch (error) {
                console.error("Error fetching admin stats:", error);
                setStats(s => ({ ...s, loading: false }));
            }
        };

        if (user) fetchStats();
    }, [user, authLoading, router]);

    if (authLoading || stats.loading) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <div className="animate-spin size-8 border-4 border-sage border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-paper py-12 px-6 lg:px-12 relative overflow-hidden">
            <div className="paper-grain opacity-40"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h1 className="font-serif text-5xl font-bold text-ink mb-2">Poste de Surveillance</h1>
                        <p className="text-sm text-ink-light/60 font-serif italic">Gestion des quotas et ressources Firebase</p>
                    </div>
                    <Link href="/library" className="px-6 py-2.5 rounded-full border border-paper-dark text- ink-light text-sm font-bold hover:bg-white transition-all shadow-sm">
                        Retour à la Bibliothèque
                    </Link>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {/* Firestore Card */}
                    <div className="bg-white/50 border border-paper-dark rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-sage">database</span>
                        </div>
                        <h3 className="text-xs font-bold text-ink-light uppercase tracking-[0.2em] mb-6">Firestore (Base de données)</h3>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-ink-light">Lectures / jour</span>
                                    <span className="font-bold text-ink">Est. {stats.estimatedReads} / 50k</span>
                                </div>
                                <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sage transition-all duration-1000"
                                        style={{ width: `${Math.min((stats.estimatedReads / 50000) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-ink-light">Documents (Scrapbooks)</span>
                                    <span className="font-bold text-ink">{stats.scrapbooksCount}</span>
                                </div>
                                <p className="text-[10px] text-ink-light/40 italic">Limite gratuite : 1 Gio de stockage total</p>
                            </div>
                        </div>
                    </div>

                    {/* Storage Card */}
                    <div className="bg-white/50 border border-paper-dark rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-rust">cloud_upload</span>
                        </div>
                        <h3 className="text-xs font-bold text-ink-light uppercase tracking-[0.2em] mb-6">Storage (Fichiers & Vidéos)</h3>

                        <div className="space-y-6">
                            <div>
                                <p className="text-3xl font-serif text-ink mb-1">5 Go <span className="text-sm font-sans font-normal text-ink-light">Inclus</span></p>
                                <p className="text-[10px] text-ink-light/60">Limite Spark : 1 Go de transfert / jour</p>
                            </div>

                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-orange-500 text-sm">warning</span>
                                    <p className="text-[11px] text-orange-800 leading-tight">
                                        L'ajout de vidéos augmentera la consommation de bande passante. Visez des fichiers &lt; 20Mo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-ink text-white rounded-[32px] p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute inset-0 paper-grain opacity-10"></div>
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-6">Plan Blaze (Paiement à l'usage)</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-sm text-white/60">Lectures (+50k)</span>
                                <span className="text-sm font-bold">$0.06 / 100k</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-sm text-white/60">Écritures (+20k)</span>
                                <span className="text-sm font-bold">$0.18 / 100k</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-white/60">Stockage (+5Go)</span>
                                <span className="text-sm font-bold">$0.026 / Go</span>
                            </div>
                        </div>

                        <a
                            href="https://console.firebase.google.com/project/scrappi-app/usage"
                            target="_blank"
                            className="mt-8 w-full py-3 bg-white text-ink rounded-xl text-center text-xs font-bold hover:bg-sage hover:text-white transition-all block relative z-10"
                        >
                            Voir la Console Firebase
                        </a>
                    </div>
                </div>

                <div className="bg-sage/5 border border-sage/20 rounded-[40px] p-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="size-20 bg-white rounded-3xl shadow-sm flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-4xl text-sage">info</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-serif font-bold text-ink mb-2">Comment éviter les frais ?</h4>
                        <p className="text-sm text-ink-light/80 leading-relaxed mb-4">
                            Le plan Spark est très généreux pour un usage personnel. Pour rester en dessous des limites :
                        </p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-ink-light">
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 bg-sage rounded-full"></span>
                                Limitez le nombre d'éléments par page.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 bg-sage rounded-full"></span>
                                Compressez vos vidéos avant l'upload.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 bg-sage rounded-full"></span>
                                Évitez de rafraîchir la bibliothèque excessivement.
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="size-1.5 bg-sage rounded-full"></span>
                                Supprimez les anciens classeurs inutiles.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
