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
        <header className={`sticky top-0 z-50 w-full transition-all duration-500 ease-in-out ${scrolled
                ? "py-3 bg-white/70 backdrop-blur-md shadow-lg border-black/5"
                : "py-5 bg-paper/90 backdrop-blur-sm border-paper-dark"
            } border-b`}>
            <div className={`mx-auto transition-all duration-500 ${scrolled ? "max-w-5xl px-4 rounded-full border border-black/5 bg-white/40 shadow-sm" : "max-w-7xl px-6 lg:px-8"}`}>
                <div className={`flex items-center justify-between transition-all duration-500 ${scrolled ? "h-14 px-6" : "h-20"}`}>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage text-white shadow-sm">
                                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>brush</span>
                            </div>
                            <span className="font-serif text-2xl font-semibold tracking-tight text-ink">Scrappi</span>
                        </Link>
                    </div>



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
