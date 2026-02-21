"use client";

import MainHeader from "@/ui/layout/MainHeader";
import Link from "next/link";

export default function LegalPage() {
    return (
        <div className="bg-paper text-ink min-h-screen relative overflow-x-hidden selection:bg-sage selection:text-white">
            <div className="paper-grain opacity-50"></div>

            <MainHeader />

            <main className="pt-32 pb-24 relative z-10">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    {/* Header Section */}
                    <div className="mb-16">
                        <h1 className="font-serif text-4xl font-bold tracking-tight text-ink mb-4">Cadre Légal</h1>
                        <p className="text-ink-light font-light italic">Dernière mise à jour : 21 février 2026</p>
                    </div>

                    {/* Navigation for sections */}
                    <div className="flex gap-8 border-b border-paper-dark mb-12">
                        <a href="#mentions" className="pb-4 text-sm font-bold uppercase tracking-widest text-ink hover:text-sage transition-colors border-b-2 border-transparent hover:border-sage">Mentions Légales</a>
                        <a href="#privacy" className="pb-4 text-sm font-bold uppercase tracking-widest text-ink hover:text-sage transition-colors border-b-2 border-transparent hover:border-sage">Confidentialité</a>
                    </div>

                    {/* Mentions Légales Section */}
                    <section id="mentions" className="mb-24 scroll-mt-32">
                        <h2 className="font-serif text-2xl font-bold text-ink mb-6">1. Mentions Légales</h2>
                        <div className="space-y-6 text-sm leading-relaxed text-ink-light font-light">
                            <div>
                                <h3 className="font-bold text-ink mb-2">Éditeur du Site</h3>
                                <p>Le site Scrappi est édité par Moussandou, entrepreneur individuel.</p>
                                <p>Contact : <a href="https://github.com/Moussandou" className="text-sage hover:underline">Via GitHub</a></p>
                            </div>

                            <div>
                                <h3 className="font-bold text-ink mb-2">Directeur de la Publication</h3>
                                <p>Moussandou</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-ink mb-2">Hébergement</h3>
                                <p>Le site est hébergé par Google Cloud Platform (Firebase Hosting).</p>
                                <p>Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-ink mb-2">Propriété Intellectuelle</h3>
                                <p>L&apos;intégralité du site Scrappi (structure, textes, logos, code source, design) est la propriété exclusive de Moussandou, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation préalable.</p>
                            </div>
                        </div>
                    </section>

                    {/* Privacy Section */}
                    <section id="privacy" className="scroll-mt-32">
                        <h2 className="font-serif text-2xl font-bold text-ink mb-6">2. Politique de Confidentialité</h2>
                        <div className="space-y-6 text-sm leading-relaxed text-ink-light font-light">
                            <div>
                                <h3 className="font-bold text-ink mb-2">Collecte de Données</h3>
                                <p>Nous collectons uniquement les données strictement nécessaires au fonctionnement de Scrappi via Firebase Authentication :</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Nom et prénom (via Google login)</li>
                                    <li>Adresse e-mail</li>
                                    <li>Photo de profil (facultatif)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-ink mb-2">Utilisation des Données</h3>
                                <p>Vos données sont utilisées exclusivement pour :</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Gérer votre compte utilisateur</li>
                                    <li>Synchroniser vos projets (scrapbooks) sur vos différents appareils</li>
                                    <li>Assurer la sécurité de vos créations (règles de sécurité Firestore)</li>
                                </ul>
                            </div>

                            <div>
                                <h3 className="font-bold text-ink mb-2">Conservation et Sécurité</h3>
                                <p>Les données sont stockées sur les serveurs sécurisés de Google Firebase. Scrappi applique le principe de moindre privilège : vous seul avez accès à vos créations grâce à nos règles de sécurité strictes.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-ink mb-2">Vos Droits (RGPD)</h3>
                                <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Vous pouvez supprimer votre compte et toutes ses données associées à tout moment depuis l&apos;application.</p>
                            </div>

                            <div>
                                <h3 className="font-bold text-ink mb-2">Cookies</h3>
                                <p>Scrappi utilise des cookies techniques essentiels fournis par Firebase pour maintenir votre session connectée. Aucun cookie de pistage publicitaire n&apos;est utilisé.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="bg-paper border-t border-paper-dark py-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <Link href="/" className="text-sage font-medium hover:underline inline-flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                        Retour à l&apos;accueil
                    </Link>
                    <p className="mt-8 text-[10px] uppercase tracking-widest text-ink-light">© 2026 Scrappi Inc. par Moussandou.</p>
                </div>
            </footer>
        </div>
    );
}
