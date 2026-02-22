"use client";

import MainHeader from "@/ui/layout/MainHeader";
import Link from "next/link";

export default function CreditsPage() {

    return (
        <div className="min-h-screen bg-paper font-sans text-ink selection:bg-sage/20 selection:text-sage flex flex-col">
            <MainHeader />

            <main className="flex-1 max-w-4xl mx-auto px-6 py-24 md:py-32 w-full">
                <div className="mb-16">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-ink-light hover:text-sage transition-colors mb-8 group">
                        <span className="material-symbols-outlined mr-2 text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Retour à l'accueil
                    </Link>
                    <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-ink mb-6">Crédits</h1>
                    <p className="text-xl text-ink-light font-light max-w-2xl leading-relaxed">
                        Ce projet n'aurait pas pu voir le jour sans une poignée d'outils incroyables et quelques nuits blanches.
                    </p>
                </div>

                <div className="space-y-16">
                    {/* L'Équipe section */}
                    <section className="bg-white rounded-3xl p-8 md:p-12 border border-paper-dark shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-sage/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-ink mb-8 flex items-center gap-3">
                            <span className="w-8 h-px bg-sage"></span>
                            L'Équipe
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-2xl font-serif text-ink mb-2">Développement</h3>
                                <p className="text-lg text-ink-light">Moussandou</p>
                                <div className="mt-4 flex gap-4">
                                    <a href="https://github.com/Moussandou" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sage hover:underline">GitHub</a>
                                    <a href="https://www.linkedin.com/in/moussandou/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sage hover:underline">LinkedIn</a>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-serif text-ink mb-2">Design (UI/UX)</h3>
                                <p className="text-lg text-ink-light">Moussandou & @takaxdev</p>
                                <div className="mt-4 flex gap-4">
                                    <a href="https://www.instagram.com/takaxdev/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sage hover:underline">Instagram @takaxdev</a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Outils & Technologies section */}
                    <section className="bg-sage/5 rounded-3xl p-8 md:p-12 border border-sage/10 relative overflow-hidden">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-ink mb-8 flex items-center gap-3">
                            <span className="w-8 h-px bg-sage"></span>
                            Technologies
                        </h2>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="flex flex-col gap-2 relative">
                                <span className="material-symbols-outlined text-4xl text-ink/40 mb-2">code_blocks</span>
                                <span className="font-serif text-xl text-ink">Next.js 14</span>
                                <span className="text-sm text-ink-light">App Router & Server Actions</span>
                            </div>

                            <div className="flex flex-col gap-2 relative">
                                <span className="material-symbols-outlined text-4xl text-ink/40 mb-2">format_paint</span>
                                <span className="font-serif text-xl text-ink">Tailwind CSS</span>
                                <span className="text-sm text-ink-light">Stylisation & Animations</span>
                            </div>

                            <div className="flex flex-col gap-2 relative">
                                <span className="material-symbols-outlined text-4xl text-ink/40 mb-2">cloud</span>
                                <span className="font-serif text-xl text-ink">Firebase</span>
                                <span className="text-sm text-ink-light">Auth, Firestore & Storage</span>
                            </div>

                            <div className="flex flex-col gap-2 relative">
                                <span className="material-symbols-outlined text-4xl text-ink/40 mb-2">view_in_ar</span>
                                <span className="font-serif text-xl text-ink">Framer Motion</span>
                                <span className="text-sm text-ink-light">Interactions fluides</span>
                            </div>
                        </div>
                    </section>

                    {/* Special Thanks section */}
                    <section className="text-center py-12">
                        <div className="w-16 h-16 mx-auto bg-white rounded-full flex items-center justify-center shadow-md mb-6 rotate-[-5deg]">
                            <span className="material-symbols-outlined text-2xl text-orange-400">local_cafe</span>
                        </div>
                        <p className="font-handwriting text-3xl text-ink max-w-lg mx-auto leading-relaxed">
                            Développé avec passion, beaucoup de café, et l'envie de redonner de la matière au digital.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer minimal */}
            <footer className="py-8 text-center border-t border-paper-dark">
                <p className="text-xs text-ink-light uppercase tracking-widest">© 2026 Scrappi. Créé pour les esprits créatifs.</p>
            </footer>
        </div>
    );
}
