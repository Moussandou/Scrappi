"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/infra/auth/authContext";
import {
    getAllScrapbooks,
    getAllUserProfiles,
    aggregateUsers,
    deleteAnyScrapbook,
    setMaintenanceMode,
    getMaintenanceStatus,
} from "@/infra/db/adminService";
import type { AdminUser } from "@/infra/db/adminService";
import { Scrapbook } from "@/domain/entities";
import Link from "next/link";

type Tab = "overview" | "users" | "scrapbooks" | "system";

export default function AdminDashboard() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [scrapbooks, setScrapbooks] = useState<(Scrapbook & { userId: string })[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [maintenance, setMaintenance] = useState({ enabled: false, message: "" });
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [allScrapbooks, maintenanceStatus, profiles] = await Promise.all([
                getAllScrapbooks(),
                getMaintenanceStatus(),
                getAllUserProfiles(),
            ]);
            setScrapbooks(allScrapbooks);
            setUsers(aggregateUsers(allScrapbooks, profiles));
            setMaintenance(maintenanceStatus);
        } catch (error) {
            console.error("Admin fetch error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push("/library");
            return;
        }
        if (user && isAdmin) fetchData();
    }, [user, authLoading, isAdmin, router, fetchData]);

    const handleDeleteScrapbook = async (id: string) => {
        try {
            await deleteAnyScrapbook(id);
            setScrapbooks(prev => prev.filter(s => s.id !== id));
            setConfirmDelete(null);
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleToggleMaintenance = async () => {
        const newState = !maintenance.enabled;
        await setMaintenanceMode(newState);
        setMaintenance(prev => ({ ...prev, enabled: newState }));
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-paper flex items-center justify-center">
                <div className="animate-spin size-8 border-4 border-sage border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!isAdmin) return null;

    // Stats
    const totalUsers = users.length;
    const totalScrapbooks = scrapbooks.length;
    const today = new Date().toISOString().split("T")[0];
    const newToday = scrapbooks.filter(s => s.createdAt.startsWith(today)).length;
    const thisWeek = new Date(Date.now() - 7 * 86400000).toISOString();
    const newThisWeek = scrapbooks.filter(s => s.createdAt >= thisWeek).length;

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: "overview", label: "Vue d'ensemble", icon: "dashboard" },
        { id: "users", label: "Utilisateurs", icon: "group" },
        { id: "scrapbooks", label: "Classeurs", icon: "auto_stories" },
        { id: "system", label: "Systeme", icon: "settings" },
    ];

    return (
        <div className="min-h-screen bg-paper py-8 px-4 lg:px-12 relative overflow-hidden">
            <div className="paper-grain opacity-40"></div>
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="font-serif text-4xl font-bold text-ink">Administration</h1>
                        <p className="text-sm text-ink-light/60 mt-1">
                            {user?.email} &mdash; {totalUsers} utilisateur{totalUsers > 1 ? "s" : ""}, {totalScrapbooks} classeur{totalScrapbooks > 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 rounded-xl border border-paper-dark text-ink-light text-xs font-bold hover:bg-white transition-all"
                        >
                            <span className="material-symbols-outlined text-sm align-middle mr-1">refresh</span>
                            Rafraichir
                        </button>
                        <Link
                            href="/library"
                            className="px-4 py-2 rounded-xl border border-paper-dark text-ink-light text-xs font-bold hover:bg-white transition-all"
                        >
                            Retour
                        </Link>
                    </div>
                </header>

                {/* Maintenance Banner */}
                {maintenance.enabled && (
                    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3">
                        <span className="material-symbols-outlined text-orange-500">warning</span>
                        <p className="text-sm text-orange-800 font-bold flex-1">Mode maintenance actif</p>
                        <button
                            onClick={handleToggleMaintenance}
                            className="text-xs font-bold text-orange-600 hover:text-orange-800 underline"
                        >
                            Desactiver
                        </button>
                    </div>
                )}

                {/* Tab Navigation */}
                <nav className="flex gap-1 mb-8 bg-white/50 rounded-2xl p-1 border border-paper-dark w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                                ? "bg-ink text-white shadow-md"
                                : "text-ink-light hover:bg-black/5"
                                }`}
                        >
                            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Tab Content */}
                <div className="animate-in fade-in duration-200">
                    {activeTab === "overview" && (
                        <OverviewTab
                            totalUsers={totalUsers}
                            totalScrapbooks={totalScrapbooks}
                            newToday={newToday}
                            newThisWeek={newThisWeek}
                            scrapbooks={scrapbooks}
                        />
                    )}

                    {activeTab === "users" && (
                        <UsersTab users={users} scrapbooks={scrapbooks} />
                    )}

                    {activeTab === "scrapbooks" && (
                        <ScrapbooksTab
                            scrapbooks={scrapbooks}
                            confirmDelete={confirmDelete}
                            onConfirmDelete={setConfirmDelete}
                            onDelete={handleDeleteScrapbook}
                        />
                    )}

                    {activeTab === "system" && (
                        <SystemTab
                            maintenance={maintenance}
                            onToggleMaintenance={handleToggleMaintenance}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ------- Tab Components -------

function OverviewTab({
    totalUsers, totalScrapbooks, newToday, newThisWeek, scrapbooks,
}: {
    totalUsers: number;
    totalScrapbooks: number;
    newToday: number;
    newThisWeek: number;
    scrapbooks: (Scrapbook & { userId: string })[];
}) {
    const statCards = [
        { label: "Utilisateurs", value: totalUsers, icon: "group", color: "text-sage" },
        { label: "Classeurs", value: totalScrapbooks, icon: "auto_stories", color: "text-ink" },
        { label: "Nouveaux aujourd'hui", value: newToday, icon: "today", color: "text-blue-500" },
        { label: "Cette semaine", value: newThisWeek, icon: "date_range", color: "text-purple-500" },
    ];

    const recentScrapbooks = scrapbooks.slice(0, 8);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(card => (
                    <div key={card.label} className="bg-white/60 border border-paper-dark rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className={`material-symbols-outlined text-2xl ${card.color}`}>{card.icon}</span>
                        </div>
                        <p className="text-3xl font-serif font-bold text-ink">{card.value}</p>
                        <p className="text-[10px] text-ink-light mt-1 uppercase tracking-wider font-bold">{card.label}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white/60 border border-paper-dark rounded-2xl p-6">
                <h3 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-4">Activite recente</h3>
                <div className="space-y-3">
                    {recentScrapbooks.map(sb => (
                        <div key={sb.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                            <div>
                                <p className="text-sm font-bold text-ink">{sb.title}</p>
                                <p className="text-[10px] text-ink-light">{(sb.userId || "inconnu").slice(0, 8)}... &mdash; {new Date(sb.updatedAt).toLocaleDateString("fr-FR")}</p>
                            </div>
                            <Link
                                href={`/admin/scrapbook/${sb.id}`}
                                className="text-[10px] font-bold text-sage hover:underline"
                            >
                                Voir
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function UsersTab({
    users, scrapbooks,
}: {
    users: AdminUser[];
    scrapbooks: (Scrapbook & { userId: string })[];
}) {
    return (
        <div className="bg-white/60 border border-paper-dark rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-paper-dark">
                <h3 className="text-xs font-bold text-ink-light uppercase tracking-wider">
                    {users.length} utilisateur{users.length > 1 ? "s" : ""}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-ink-light border-b border-paper-dark">
                            <th className="px-5 py-3 font-bold">Utilisateur</th>
                            <th className="px-5 py-3 font-bold">Email</th>
                            <th className="px-5 py-3 font-bold">Classeurs</th>
                            <th className="px-5 py-3 font-bold">Derniere activite</th>
                            <th className="px-5 py-3 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => (
                            <tr key={u.uid || `user-${i}`} className="border-b border-black/5 hover:bg-sage/5 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        {u.photoURL ? (
                                            <img src={u.photoURL} alt="" className="size-7 rounded-full object-cover" />
                                        ) : (
                                            <div className="size-7 rounded-full bg-sage/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[14px] text-sage">person</span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs font-bold text-ink">{u.displayName || "Sans nom"}</p>
                                            <code className="text-[10px] text-ink-light/50">{(u.uid || "?").slice(0, 10)}...</code>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3 text-xs text-ink-light">{u.email || "-"}</td>
                                <td className="px-5 py-3 font-bold">{u.scrapbookCount}</td>
                                <td className="px-5 py-3 text-ink-light text-xs">
                                    {u.latestActivity
                                        ? new Date(u.latestActivity).toLocaleDateString("fr-FR", {
                                            day: "numeric", month: "short", year: "numeric",
                                        })
                                        : "-"}
                                </td>
                                <td className="px-5 py-3">
                                    <button
                                        onClick={() => {
                                            const userScrapbooks = scrapbooks.filter(s => s.userId === u.uid);
                                            const titles = userScrapbooks.map(s => `- ${s.title}`).join("\n");
                                            alert(`Classeurs de ${u.displayName || u.uid?.slice(0, 8)}:\n${titles || "(aucun)"}`);
                                        }}
                                        className="text-[10px] font-bold text-sage hover:underline"
                                    >
                                        Voir classeurs
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ScrapbooksTab({
    scrapbooks, confirmDelete, onConfirmDelete, onDelete,
}: {
    scrapbooks: (Scrapbook & { userId: string })[];
    confirmDelete: string | null;
    onConfirmDelete: (id: string | null) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="bg-white/60 border border-paper-dark rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-paper-dark">
                <h3 className="text-xs font-bold text-ink-light uppercase tracking-wider">
                    {scrapbooks.length} classeur{scrapbooks.length > 1 ? "s" : ""}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-ink-light border-b border-paper-dark">
                            <th className="px-5 py-3 font-bold">Titre</th>
                            <th className="px-5 py-3 font-bold">Proprietaire</th>
                            <th className="px-5 py-3 font-bold">Modifie</th>
                            <th className="px-5 py-3 font-bold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scrapbooks.map(sb => (
                            <tr key={sb.id} className="border-b border-black/5 hover:bg-sage/5 transition-colors">
                                <td className="px-5 py-3 font-bold text-ink">{sb.title}</td>
                                <td className="px-5 py-3">
                                    <code className="text-[11px] bg-black/5 px-2 py-0.5 rounded">{(sb.userId || "inconnu").slice(0, 12)}...</code>
                                </td>
                                <td className="px-5 py-3 text-ink-light text-xs">
                                    {new Date(sb.updatedAt).toLocaleDateString("fr-FR", {
                                        day: "numeric", month: "short",
                                    })}
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={`/admin/scrapbook/${sb.id}`}
                                            className="text-[10px] font-bold text-sage hover:underline"
                                        >
                                            Voir
                                        </Link>
                                        {confirmDelete === sb.id ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onDelete(sb.id)}
                                                    className="text-[10px] font-bold text-red-600 hover:underline"
                                                >
                                                    Confirmer
                                                </button>
                                                <button
                                                    onClick={() => onConfirmDelete(null)}
                                                    className="text-[10px] font-bold text-ink-light hover:underline"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => onConfirmDelete(sb.id)}
                                                className="text-[10px] font-bold text-red-400 hover:text-red-600"
                                            >
                                                Supprimer
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SystemTab({
    maintenance, onToggleMaintenance,
}: {
    maintenance: { enabled: boolean; message: string };
    onToggleMaintenance: () => void;
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Maintenance */}
            <div className="bg-white/60 border border-paper-dark rounded-2xl p-6">
                <h3 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-4">Mode Maintenance</h3>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-bold text-ink">
                            {maintenance.enabled ? "Actif" : "Desactive"}
                        </p>
                        <p className="text-[10px] text-ink-light mt-1">
                            {maintenance.enabled
                                ? "Seul l'admin peut acceder a l'application."
                                : "L'application est accessible a tous."}
                        </p>
                    </div>
                    <button
                        onClick={onToggleMaintenance}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${maintenance.enabled
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-sage/10 text-sage hover:bg-sage/20"
                            }`}
                    >
                        {maintenance.enabled ? "Desactiver" : "Activer"}
                    </button>
                </div>
            </div>

            {/* API Health */}
            <div className="bg-white/60 border border-paper-dark rounded-2xl p-6">
                <h3 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-4">Sante des Services</h3>
                <div className="space-y-3">
                    <ServiceStatus label="Firebase Auth" status="ok" />
                    <ServiceStatus label="Cloud Firestore" status="ok" />
                    <ServiceStatus label="Cloud Storage" status="ok" />
                </div>
                <a
                    href="https://console.firebase.google.com/project/scrappi-app/overview"
                    target="_blank"
                    className="mt-4 inline-block text-[10px] font-bold text-sage hover:underline"
                >
                    Ouvrir la Console Firebase
                </a>
            </div>

            {/* Firestore Quotas */}
            <div className="bg-white/60 border border-paper-dark rounded-2xl p-6">
                <h3 className="text-xs font-bold text-ink-light uppercase tracking-wider mb-4">Quotas Firebase (Spark)</h3>
                <div className="space-y-4">
                    <QuotaBar label="Stockage Firestore" used="?" limit="1 Gio" percent={0} />
                    <QuotaBar label="Stockage Storage" used="?" limit="5 Go" percent={0} />
                </div>
                <p className="text-[10px] text-ink-light/50 mt-3 italic">
                    Les quotas exacts sont visibles sur la console Firebase.
                </p>
            </div>

            {/* Quick Links */}
            <div className="bg-ink text-white rounded-2xl p-6">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Liens rapides</h3>
                <div className="space-y-2">
                    {[
                        { label: "Console Firebase", url: "https://console.firebase.google.com/project/scrappi-app" },
                        { label: "Firebase Auth", url: "https://console.firebase.google.com/project/scrappi-app/authentication/users" },
                        { label: "Firestore", url: "https://console.firebase.google.com/project/scrappi-app/firestore" },
                        { label: "Storage", url: "https://console.firebase.google.com/project/scrappi-app/storage" },
                        { label: "Usage & Billing", url: "https://console.firebase.google.com/project/scrappi-app/usage" },
                    ].map(link => (
                        <a
                            key={link.label}
                            href={link.url}
                            target="_blank"
                            className="flex items-center justify-between py-2 border-b border-white/10 last:border-0 text-sm text-white/80 hover:text-white transition-colors"
                        >
                            <span>{link.label}</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ServiceStatus({ label, status }: { label: string; status: "ok" | "error" | "warn" }) {
    const colors = {
        ok: "bg-green-500",
        warn: "bg-orange-500",
        error: "bg-red-500",
    };
    return (
        <div className="flex items-center gap-3">
            <div className={`size-2 rounded-full ${colors[status]}`}></div>
            <span className="text-sm text-ink">{label}</span>
            <span className="text-[10px] text-ink-light ml-auto">
                {status === "ok" ? "Operationnel" : status === "warn" ? "Avertissement" : "Erreur"}
            </span>
        </div>
    );
}

function QuotaBar({ label, used, limit, percent }: { label: string; used: string; limit: string; percent: number }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="text-ink-light">{label}</span>
                <span className="font-bold text-ink">{used} / {limit}</span>
            </div>
            <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
}
