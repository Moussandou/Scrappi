"use client";

import Link from "next/link";
import { useAuth } from "@/infra/auth/authContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <header className={`sticky top-0 z-50 w-full transition-all duration-500 ease-in-out ${scrolled ? "pt-4 px-4" : "pt-0 px-0"
            }`}>
            <div className={`mx-auto transition-all duration-500 ease-in-out ${scrolled
                ? "max-w-5xl rounded-full border border-black/5 bg-white/70 backdrop-blur-md shadow-lg"
                : "max-w-full bg-paper/90 backdrop-blur-sm border-b border-paper-dark"
                }`}>
                <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-500 ${scrolled ? "h-14" : "h-16 md:h-20"
                    }`}>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-2 md:gap-3">
                            <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-lg bg-sage text-white shadow-sm shrink-0">
                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>brush</span>
                            </div>
                            <span className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-ink">Scrappi</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        {!loading && (
                            <>
                                {user ? (
                                    <>
                                        <Link href="/profile" className="flex items-center gap-2 md:gap-3 pr-2 md:pr-4 border-r border-paper-dark hover:opacity-80 transition-opacity">
                                            <img src={user.photoURL || ""} alt="" className="size-7 md:size-8 rounded-full border border-black/5" />
                                            <span className="text-xs font-medium text-ink-light hidden lg:block">{user.displayName}</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="text-xs md:text-sm font-light text-ink-light hover:text-ink transition-colors hidden sm:block"
                                        >
                                            Déconnexion
                                        </button>
                                        <Link href="/library" className="flex items-center justify-center rounded-full bg-sage px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-medium text-white shadow-soft transition-all hover:bg-opacity-90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2">
                                            <span className="sm:hidden">Atelier</span>
                                            <span className="hidden sm:inline">Ouvrir l&apos;Atelier</span>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="flex items-center justify-center rounded-full bg-sage px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-medium text-white shadow-soft transition-all hover:bg-opacity-90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2">
                                            <span className="sm:hidden">Connexion</span>
                                            <span className="hidden sm:inline">Créer gratuitement</span>
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
