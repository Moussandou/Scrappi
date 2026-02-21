"use client";

import Link from "next/link";
import { useAuth } from "@/infra/auth/authContext";
import { useRouter } from "next/navigation";

interface HeaderProps {
    showNav?: boolean;
}

export default function Header({ showNav = true }: HeaderProps) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
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

                    {showNav && (
                        <nav className="hidden md:flex items-center gap-10">
                            <Link className="text-sm font-light text-ink-light hover:text-sage transition-colors" href="/library">Bibliothèque</Link>
                            <a className="text-sm font-light text-ink-light hover:text-sage transition-colors" href="/#features">Fonctionnalités</a>
                            <a className="text-sm font-light text-ink-light hover:text-sage transition-colors" href="#">Tarifs</a>
                        </nav>
                    )}

                    <div className="flex items-center gap-4">
                        {!loading && (
                            <>
                                {user ? (
                                    <>
                                        <div className="flex items-center gap-3 pr-4 border-r border-paper-dark">
                                            <img src={user.photoURL || ""} alt="" className="size-8 rounded-full border border-black/5" />
                                            <span className="text-xs font-medium text-ink-light hidden sm:block">{user.displayName}</span>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="text-sm font-light text-ink-light hover:text-ink transition-colors"
                                        >
                                            Déconnexion
                                        </button>
                                        <Link href="/library" className="flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:bg-opacity-90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2">
                                            Ouvrir l&apos;Atelier
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="hidden text-sm font-medium text-ink-light hover:text-ink md:block">
                                            Connexion
                                        </Link>
                                        <Link href="/login" className="flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:bg-opacity-90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2">
                                            Créer gratuitement
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
