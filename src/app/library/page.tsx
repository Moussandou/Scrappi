"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createScrapbook, getScrapbooks, updateScrapbook } from "@/infra/db/firestoreService";
import { Scrapbook } from "@/domain/entities";
import { useAuth } from "@/infra/auth/authContext";
import Header from "@/ui/Header";
import ProjectModal from "@/ui/ProjectModal";

export default function LibraryOverview() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [scrapbooks, setScrapbooks] = useState<Scrapbook[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        mode: "create" | "edit";
        initialData?: Scrapbook;
    }>({ isOpen: false, mode: "create" });

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

    const handleOpenCreate = () => {
        setModalConfig({ isOpen: true, mode: "create" });
    };

    const handleOpenEdit = (e: React.MouseEvent, scrapbook: Scrapbook) => {
        e.preventDefault();
        e.stopPropagation();
        setModalConfig({ isOpen: true, mode: "edit", initialData: scrapbook });
    };

    const handleConfirmModal = async (data: { title: string; binderColor: string; coverImage?: string }) => {
        if (!user) return;

        try {
            if (modalConfig.mode === "create") {
                const newScrapbook = await createScrapbook(data.title, user.uid, data.binderColor, data.coverImage);
                router.push(`/project/${newScrapbook.id}`);
            } else if (modalConfig.mode === "edit" && modalConfig.initialData) {
                await updateScrapbook(modalConfig.initialData.id, {
                    title: data.title,
                    binderColor: data.binderColor,
                    coverImage: data.coverImage
                });
                // Refresh list locally
                setScrapbooks(prev => prev.map(s =>
                    s.id === modalConfig.initialData?.id
                        ? { ...s, ...data }
                        : s
                ));
                setModalConfig({ ...modalConfig, isOpen: false });
            }
        } catch (error) {
            console.error("Error saving scrapbook:", error);
            alert("Erreur lors de l'enregistrement du classeur.");
        }
    };

    const getBinderStyle = (scrapbook: Scrapbook) => {
        const color = scrapbook.binderColor || "#e8e4dc";
        // Calculate a darker version for the border-l (simpler: use black/20 overlay in JSX)
        return { backgroundColor: color };
    };

    return (
        <div className="bg-paper text-ink min-h-screen relative overflow-x-hidden selection:bg-sage selection:text-white">
            <div className="paper-grain"></div>

            <Header />

            <main className="py-24 relative overflow-hidden">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center mb-16">
                        <h2 className="text-sage font-medium tracking-wide text-sm uppercase mb-3">Bibliothèque</h2>
                        <p className="mt-2 text-4xl font-serif font-medium tracking-tight text-ink sm:text-5xl">Vos Classeurs</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-12">
                        {/* Create New Card */}
                        <div
                            onClick={handleOpenCreate}
                            className={`group relative aspect-[3/4] bg-white rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-md border-2 border-dashed border-sage/30 flex flex-col items-center justify-center cursor-pointer`}
                        >
                            <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center text-sage mb-4 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl">add</span>
                            </div>
                            <h3 className="font-serif text-lg text-ink font-semibold">Nouveau classeur</h3>
                        </div>

                        {loading ? (
                            <div className="text-ink-light col-span-3 py-10 text-center font-handwriting text-2xl">Recherche de vos classeurs...</div>
                        ) : (
                            scrapbooks.map((scrapbook) => {
                                const binderStyle = getBinderStyle(scrapbook);
                                const isDark = scrapbook.binderColor === "#1a1e26" || scrapbook.binderColor === "#3a4a3a";

                                return (
                                    <div key={scrapbook.id} className="relative group">
                                        <Link href={`/project/${scrapbook.id}`}>
                                            <div
                                                className={`relative aspect-[3/4] rounded-r-2xl rounded-l-sm shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-l-[12px] border-l-black/20 overflow-hidden`}
                                                style={binderStyle}
                                            >
                                                {/* Cover Texture */}
                                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-10 mix-blend-overlay"></div>

                                                {/* Spine shadow */}
                                                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10"></div>

                                                {/* Cover Image if any */}
                                                {scrapbook.coverImage && (
                                                    <div className="absolute inset-0 z-0">
                                                        <img src={scrapbook.coverImage} alt="" className="w-full h-full object-cover opacity-60 mix-blend-multiply" />
                                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20"></div>
                                                    </div>
                                                )}

                                                <div className={`absolute top-12 left-1/2 -translate-x-1/2 ${isDark ? 'bg-white text-ink' : 'bg-white/95 text-ink'} px-4 py-3 shadow-sm border border-black/5 rotate-1 min-w-[140px] text-center z-20`}>
                                                    <h3 className="font-serif text-lg font-semibold truncate">{scrapbook.title}</h3>
                                                    <p className="text-[10px] text-ink-light mt-1 font-mono uppercase tracking-widest opacity-60">{new Date(scrapbook.createdAt).toLocaleDateString()}</p>
                                                </div>

                                                <div className="absolute bottom-0 w-full h-1/2 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-30 pointer-events-none">
                                                    <span className="bg-sage text-white px-6 py-2 rounded-full text-sm font-medium shadow-md">Ouvrir</span>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Edit Button */}
                                        <button
                                            onClick={(e) => handleOpenEdit(e, scrapbook)}
                                            className="absolute top-2 right-2 size-8 rounded-full bg-white/80 backdrop-blur-md border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-ink-light hover:text-sage z-40"
                                            title="Modifier les paramètres"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">settings</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>

            <ProjectModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleConfirmModal}
                initialData={modalConfig.initialData}
                title={modalConfig.mode === "create" ? "Nouveau Classeur" : "Paramètres du Classeur"}
            />
        </div>
    );
}
