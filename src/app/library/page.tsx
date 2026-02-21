"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createScrapbook, getScrapbooks, updateScrapbook } from "@/infra/db/firestoreService";
import { Scrapbook } from "@/domain/entities";
import { useAuth } from "@/infra/auth/authContext";
import MainHeader from "@/ui/layout/MainHeader";
import ProjectSettingsModal from "@/ui/modals/ProjectSettingsModal";
import { BookBinder } from "@/ui/components/BookBinder";

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

    const handleOpenCreate = () => {
        setModalConfig({ isOpen: true, mode: "create" });
    };

    const handleOpenEdit = (e: React.MouseEvent, scrapbook: Scrapbook) => {
        e.preventDefault();
        e.stopPropagation();
        setModalConfig({ isOpen: true, mode: "edit", initialData: scrapbook });
    };

    const handleConfirmModal = async (data: { title: string; binderColor: string; coverImage?: string; binderGrain?: number }) => {
        if (!user) return;
        setCreating(true);
        try {
            if (modalConfig.mode === "create") {
                const newId = await createScrapbook(user.uid, data.title, data.binderColor, data.coverImage, data.binderGrain);
                router.push(`/project/${newId}`);
            } else if (modalConfig.mode === "edit" && modalConfig.initialData) {
                await updateScrapbook(modalConfig.initialData.id ?? "", data);
                setScrapbooks(prev => prev.map(s => s.id === modalConfig.initialData?.id ? { ...s, ...data } : s));
            }
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (error) {
            console.error("Erreur", error);
            alert("Une erreur est survenue.");
        } finally {
            setCreating(false);
        }
    };


    const getBinderStyle = (scrapbook: Scrapbook) => {
        const color = scrapbook.binderColor || "#e8e4dc";
        return { backgroundColor: color };
    };


    return (
        <div className="bg-paper text-ink min-h-screen relative overflow-x-hidden selection:bg-sage selection:text-white">
            <div className="paper-grain"></div>

            <MainHeader />

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
                                    <div key={scrapbook.id} className="relative group/wrapper w-full aspect-[3/4]">
                                        <BookBinder
                                            scrapbook={scrapbook}
                                            interactive={true}
                                            showDetails={true}
                                            onOpenStart={() => router.prefetch(`/project/${scrapbook.id}`)}
                                            onClick={() => router.push(`/project/${scrapbook.id}`)}
                                        />

                                        {/* Edit Button */}
                                        <button
                                            onClick={(e) => handleOpenEdit(e, scrapbook)}
                                            className="absolute top-2 right-2 size-8 rounded-full bg-white/80 backdrop-blur-md border border-black/5 opacity-0 group-hover/wrapper:opacity-100 transition-opacity flex items-center justify-center text-ink-light hover:text-sage z-50 shadow-sm"
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

            <ProjectSettingsModal
                title={modalConfig.mode === "create" ? "Nouveau classeur" : "Paramètres du classeur"}
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={handleConfirmModal}
                initialData={modalConfig.mode === "edit" ? modalConfig.initialData : undefined}
            />
        </div>
    );
}
