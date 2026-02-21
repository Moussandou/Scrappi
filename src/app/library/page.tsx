"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createScrapbook, getScrapbooks } from "@/infra/db/firestoreService";
import { Scrapbook } from "@/domain/entities";
import { useAuth } from "@/infra/auth/authContext";

export default function LibraryOverview() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const [scrapbooks, setScrapbooks] = useState<Scrapbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        if (user) {
            async function fetchScrapbooks() {
                try {
                    const data = await getScrapbooks(user!.uid);
                    setScrapbooks(data);
                } catch (error) {
                    console.error("Failed to fetch scrapbooks", error);
                } finally {
                    setLoading(false);
                }
            }
            fetchScrapbooks();
        }
    }, [user, authLoading, router]);

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    const handleCreate = async () => {
        if (!user) return;
        setCreating(true);
        try {
            const newScrapbook = await createScrapbook("Nouveau Classeur", user.uid);
            router.push(`/project/${newScrapbook.id}`);
        } catch (error) {
            console.error("Error creating scrapbook:", error);
            alert("Erreur lors de la création du classeur.");
            setCreating(false);
        }
    };

    const getBinderColor = (index: number) => {
        const colors = [
            "bg-[#e8e4dc] border-l-[#8B4513]",
            "bg-[#3a4a3a] border-l-[#1a2a1a] text-white",
            "bg-[#c7bca5] border-l-[#8c7b5d]",
            "bg-pastel-blue border-l-blue-400",
            "bg-pastel-pink border-l-pink-400"
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="bg-paper text-ink min-h-screen relative overflow-x-hidden selection:bg-sage selection:text-white">
            <div className="paper-grain"></div>

            <header className="sticky top-0 z-40 w-full transition-all duration-300 bg-paper/90 backdrop-blur-sm border-b border-paper-dark">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Link href="/" className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage text-white shadow-sm">
                                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>brush</span>
                                </div>
                                <span className="font-serif text-2xl font-semibold tracking-tight text-ink">Scrappi</span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            {user && (
                                <div className="flex items-center gap-3 pr-4 border-r border-paper-dark">
                                    <img src={user.photoURL || ""} alt="" className="size-8 rounded-full border border-black/5" />
                                    <span className="text-xs font-medium text-ink-light hidden sm:block">{user.displayName}</span>
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="text-sm font-light text-ink-light hover:text-ink transition-colors"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="py-24 relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-sage font-medium tracking-wide text-sm uppercase mb-3">Bibliothèque</h2>
                        <p className="mt-2 text-4xl font-serif font-medium tracking-tight text-ink sm:text-5xl">Vos Classeurs</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-12">
                        {/* Create New Card */}
                        <div
                            onClick={handleCreate}
                            className={`group relative aspect-[3/4] bg-white rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-md border-2 border-dashed border-sage/30 flex flex-col items-center justify-center cursor-pointer ${creating ? 'opacity-50' : 'opacity-100'}`}
                        >
                            <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center text-sage mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">{creating ? "hourglass_empty" : "add"}</span>
                            </div>
                            <h3 className="font-serif text-lg text-ink font-semibold">Nouveau classeur</h3>
                        </div>

                        {loading ? (
                            <div className="text-ink-light col-span-3 py-10 text-center font-handwriting text-2xl">Recherche de vos classeurs...</div>
                        ) : (
                            scrapbooks.map((scrapbook, idx) => {
                                const colorClasses = getBinderColor(idx);
                                const isDark = colorClasses.includes("text-white");

                                return (
                                    <Link href={`/project/${scrapbook.id}`} key={scrapbook.id}>
                                        <div className={`group relative aspect-[3/4] ${colorClasses} rounded-r-2xl rounded-l-sm shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-l-8 overflow-hidden`}>
                                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10"></div>
                                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 mix-blend-overlay"></div>

                                            <div className={`absolute top-12 left-1/2 -translate-x-1/2 ${isDark ? 'bg-white text-ink' : 'bg-white/90 text-ink'} px-4 py-3 shadow-sm border border-black/5 rotate-1 min-w-[140px] text-center`}>
                                                <h3 className="font-serif text-lg font-semibold truncate">{scrapbook.title}</h3>
                                                <p className="text-xs text-ink-light mt-1 font-mono">{new Date(scrapbook.createdAt).toLocaleDateString()}</p>
                                            </div>

                                            <div className="absolute bottom-0 w-full h-1/2 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                <button className="bg-sage text-white px-6 py-2 rounded-full text-sm font-medium shadow-md hover:bg-sage/90">Ouvrir</button>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
