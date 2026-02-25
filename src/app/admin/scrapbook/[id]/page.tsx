"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/infra/auth/authContext";
import { getScrapbook } from "@/infra/db/firestoreService";
import { getAnyElements } from "@/infra/db/adminService";
import { Scrapbook, CanvasElement } from "@/domain/entities";
import InfiniteCanvas from "@/features/canvas/components/CanvasStage";
import { useCanvasStore } from "@/features/canvas/store/useCanvasStore";
import Link from "next/link";

export default function AdminScrapbookViewer() {
    const { id } = useParams<{ id: string }>();
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();

    const [scrapbook, setScrapbook] = useState<Scrapbook | null>(null);
    const [elements, setElements] = useState<CanvasElement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push("/library");
            return;
        }

        const fetchData = async () => {
            try {
                const [sb, elems] = await Promise.all([
                    getScrapbook(id),
                    getAnyElements(id),
                ]);
                setScrapbook(sb);
                setElements(elems);
                const store = useCanvasStore.getState();
                store.setElements(elems);
                store.setActiveTool('hand');
            } catch (error) {
                console.error("Failed to load scrapbook:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && isAdmin) fetchData();
    }, [user, authLoading, isAdmin, id, router]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <div className="animate-spin size-8 border-4 border-sage border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!scrapbook) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <p className="text-ink-light">Classeur introuvable.</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col relative">
            {/* Read-only banner */}
            <div className="bg-ink text-white px-4 py-2 flex items-center justify-between z-50 relative">
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin"
                        className="text-xs font-bold text-white/60 hover:text-white transition-colors flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                        Admin
                    </Link>
                    <span className="text-white/20">|</span>
                    <h1 className="text-sm font-bold">{scrapbook.title}</h1>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">
                        Lecture seule
                    </span>
                </div>
                <p className="text-[10px] text-white/40">
                    {elements.length} element{elements.length > 1 ? "s" : ""}
                </p>
            </div>

            {/* Canvas (read-only: no tool, no draggable, no save) */}
            <div className="flex-1 relative">
                <InfiniteCanvas />
            </div>
        </div>
    );
}
