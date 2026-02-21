"use client";

import { useAuth } from "@/infra/auth/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import MainHeader from "@/ui/layout/MainHeader";

export default function LoginPage() {
    const { user, loginWithGoogle } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            router.push("/library");
        }
    }, [user, router]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-paper min-h-screen relative flex flex-col selection:bg-sage selection:text-white overflow-hidden">
            <div className="paper-grain opacity-50"></div>

            <MainHeader />

            <div className="flex-grow flex flex-col items-center justify-center p-6 pb-20">

                {/* Artistic backgrounds */}
                <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-sage/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] aspect-square bg-sage/5 rounded-full blur-3xl -z-10"></div>

                <div className="w-full max-w-md z-10">
                    <div className="flex flex-col items-center mb-12">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sage text-white shadow-lg mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
                            <span className="material-symbols-outlined text-[32px]">brush</span>
                        </div>
                        <h1 className="font-serif text-4xl font-bold tracking-tight text-ink mb-2">Scrappi</h1>
                        <p className="text-ink-light font-light italic">Votre atelier créatif vous attend.</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-md p-8 rounded-[32px] border border-black/5 shadow-xl space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sage/20 to-transparent"></div>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-black/10 py-4 px-6 rounded-2xl text-ink font-medium shadow-sm transition-all hover:shadow-md hover:border-black/20 active:scale-[0.98] disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    style={{ fill: "#4285F4" }}
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    style={{ fill: "#34A853" }}
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                                    style={{ fill: "#FBBC05" }}
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    style={{ fill: "#EA4335" }}
                                />
                            </svg>
                            {isLoading ? "Connexion en cours..." : "Continuer avec Google"}
                        </button>

                        <div className="relative py-4 flex items-center justify-center">
                            <div className="absolute inset-x-0 h-px bg-black/5"></div>
                            <span className="relative px-4 bg-white/0 text-[10px] uppercase tracking-widest text-ink-light font-bold">ou</span>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ml-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="atelier@creatif.fr"
                                    className="w-full bg-black/5 border border-transparent rounded-2xl py-4 px-6 outline-none focus:bg-white focus:border-sage/30 transition-all text-ink placeholder:text-ink-light/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ml-1">Mot de passe</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-black/5 border border-transparent rounded-2xl py-4 px-6 outline-none focus:bg-white focus:border-sage/30 transition-all text-ink placeholder:text-ink-light/50"
                                />
                            </div>
                            <button
                                disabled
                                className="w-full bg-ink text-white py-4 rounded-2xl font-semibold opacity-30 cursor-not-allowed hover:bg-ink/90 transition-all"
                            >
                                Se connecter
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-ink-light text-sm font-light">
                            En continuant, vous rejoignez Scrappi.
                            <br />
                            <Link href="/" className="text-sage font-medium mt-2 inline-block hover:underline">
                                Retour à l&apos;accueil
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Washi tape decoration */}
                <div className="absolute top-10 left-[-20px] w-40 h-10 bg-sage/20 rotate-[35deg] backdrop-blur-[2px] opacity-40"></div>
                <div className="absolute bottom-10 right-[-20px] w-40 h-10 bg-ink/10 rotate-[-25deg] backdrop-blur-[2px] opacity-20"></div>
            </div>
        </div>
    );
}
