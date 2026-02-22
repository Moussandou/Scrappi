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
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"recent" | "oldest" | "alphabetical">("recent");
    const [error, setError] = useState<string | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const sortOptions = [
        { label: "Nouveaux", value: "recent" as const },
        { label: "Anciens", value: "oldest" as const },
        { label: "Alphabétique", value: "alphabetical" as const },
    ];

    const currentSortLabel = sortOptions.find(o => o.value === sortBy)?.label || "Trier";

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isSortOpen) setIsSortOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSortOpen]);

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

    const filteredAndSortedScrapbooks = scrapbooks
        .filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "recent") {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }
            if (sortBy === "oldest") {
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            }
            if (sortBy === "alphabetical") {
                return a.title.localeCompare(b.title);
            }
            return 0;
        });

    const handleOpenCreate = () => {
        setError(null);
        setModalConfig({ isOpen: true, mode: "create" });
    };

    const handleOpenEdit = (e: React.MouseEvent, scrapbook: Scrapbook) => {
        e.preventDefault();
        e.stopPropagation();
        setError(null);
        setModalConfig({ isOpen: true, mode: "edit", initialData: scrapbook });
    };

    const handleConfirmModal = async (data: {
        title: string;
        binderColor: string;
        coverImage?: string | null;
        binderGrain?: number;
        coverZoom?: number;
        coverX?: number;
        coverY?: number;
        showPreview?: boolean;
    }) => {
        if (!user) return;
        setCreating(true);
        setError(null);
        try {
            if (modalConfig.mode === "create") {
                const newId = await createScrapbook(
                    user.uid,
                    data.title,
                    data.binderColor,
                    data.coverImage || undefined,
                    data.binderGrain,
                    data.coverZoom,
                    data.coverX,
                    data.coverY,
                    data.showPreview
                );
                router.push(`/project/${newId}`);
            } else if (modalConfig.mode === "edit" && modalConfig.initialData) {
                // Ensure null coverImage is handled for deletion
                const updateData = { ...data, coverImage: data.coverImage === "" ? null : data.coverImage };
                await updateScrapbook(modalConfig.initialData.id ?? "", updateData as any);
                setScrapbooks(prev => prev.map(s => s.id === modalConfig.initialData?.id ? { ...s, ...updateData } as Scrapbook : s));
            }
            setModalConfig({ ...modalConfig, isOpen: false });
        } catch (error) {
            console.error("Erreur", error);
            setError("Une erreur est survenue lors de l'enregistrement.");
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
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h2 className="text-sage font-medium tracking-wide text-sm uppercase mb-3 text-center md:text-left">Bibliothèque</h2>
                            <p className="text-4xl font-serif font-medium tracking-tight text-ink sm:text-5xl text-center md:text-left">Vos Classeurs</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                            <div className="relative w-full sm:w-64">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-ink-light text-[20px]">search</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-paper-dark rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all shadow-sm"
                                />
                            </div>
                            <div className="relative w-full sm:w-48" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => setIsSortOpen(!isSortOpen)}
                                    className="w-full flex items-center justify-between px-5 py-2.5 bg-white border border-paper-dark rounded-full text-sm hover:border-sage transition-all shadow-sm group"
                                >
                                    <span className="text-ink font-medium">{currentSortLabel}</span>
                                    <span className={`material-symbols-outlined text-ink-light transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>

                                {isSortOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-paper-dark rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="paper-grain opacity-20 pointer-events-none"></div>
                                        {sortOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setSortBy(option.value);
                                                    setIsSortOpen(false);
                                                }}
                                                className={`w-full text-left px-5 py-3 text-sm transition-colors flex items-center justify-between group/item ${sortBy === option.value ? 'bg-sage/5 text-sage font-bold' : 'text-ink-light hover:bg-black/5 hover:text-ink'}`}
                                            >
                                                {option.label}
                                                {sortBy === option.value && <span className="material-symbols-outlined text-[16px]">check</span>}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
                            filteredAndSortedScrapbooks.map((scrapbook) => {
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

                        {!loading && filteredAndSortedScrapbooks.length === 0 && searchTerm && (
                            <div className="col-span-full py-20 text-center">
                                <span className="material-symbols-outlined text-5xl text-ink-light/20 mb-4">folder_off</span>
                                <p className="text-ink-light font-serif italic text-lg">Aucun classeur ne correspond à votre recherche.</p>
                            </div>
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
                error={error}
            />
        </div>
    );
}
