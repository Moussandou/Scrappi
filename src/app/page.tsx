"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/infra/auth/authContext";
import MainHeader from "@/ui/layout/MainHeader";
import { BookBinder } from "@/ui/components/BookBinder";

const dummyBinders = [
  { c: "#8c443e", i: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400&fit=crop" },
  { c: "#2a3b4c" },
  { c: "#e8e4dc", i: "https://images.unsplash.com/photo-1495521821757-a1efb6729054?q=80&w=400&fit=crop" },
  { c: "#3a4a3a" },
  { c: "#c7bca5", i: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=400&fit=crop" },
  { c: "#6B8E6B", i: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=400&fit=crop" },
  { c: "#f4a261" },
  { c: "#264653", i: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400&fit=crop" }
];

const renderMarqueeRow = (reverse = false) => (
  <div className={`flex gap-4 md:gap-8 whitespace-nowrap opacity-[0.15] ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} w-max py-4`}>
    {[...dummyBinders, ...dummyBinders, ...dummyBinders, ...dummyBinders].map((b, i) => (
      <div key={i} className="w-24 md:w-32 lg:w-40 xl:w-48 aspect-[3/4] rounded-r-lg rounded-l-sm shadow-[0_10px_20px_rgba(0,0,0,0.2)] border-l-[6px] border-black/30 relative overflow-hidden shrink-0" style={{ backgroundColor: b.c }}>
        {b.i && <img src={b.i} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-multiply" alt="" />}
        <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/20 to-transparent" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-20 mix-blend-overlay"></div>
      </div>
    ))}
  </div>
);

export default function LandingPage() {
  const { user } = useAuth();

  // States for the interactive gallery binder
  const [galleryBinderOpen, setGalleryBinderOpen] = useState(false);
  const [galleryBinderTitle, setGalleryBinderTitle] = useState("Mon Classeur");
  const [galleryBinderColor, setGalleryBinderColor] = useState("#c7bca5");
  const [galleryBinderGrain, setGalleryBinderGrain] = useState(0.1);
  const [galleryBinderImage, setGalleryBinderImage] = useState("https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400&fit=crop");

  return (
    <div className="bg-paper text-ink font-display selection:bg-sage selection:text-white">
      <div className="paper-grain"></div>

      <div className="relative flex min-h-screen w-full flex-col group/design-root">
        <MainHeader />

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="relative isolate overflow-hidden pt-14 lg:pt-24 pb-20">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="flex-1 max-w-2xl lg:max-w-xl text-center lg:text-left z-10">
                  <div className="inline-flex items-center rounded-full border border-sage/20 bg-sage/5 px-3 py-1 text-sm font-medium text-sage mb-6">
                    <span className="flex h-2 w-2 rounded-full bg-sage mr-2"></span>
                    Bêta publique ouverte
                  </div>
                  <h1 className="font-serif text-5xl font-medium tracking-tight text-ink sm:text-7xl mb-6 leading-[1.1]">
                    Scrappi : Votre <br />
                    <span className="italic text-sage">Carnet Créatif Infini</span>
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-ink-light font-light max-w-lg mx-auto lg:mx-0">
                    Redécouvrez le plaisir tactile du papier dans un espace numérique sans limites. Créez des moodboards, journaux et collages avec une âme analogique.
                  </p>
                  <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
                    <Link
                      href={user ? "/library" : "/login"}
                      className="rounded-full bg-sage px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-opacity-90 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage"
                    >
                      {user ? "Ouvrir l'Atelier" : "Commencer à créer"}
                    </Link>
                    <a className="text-sm font-semibold leading-6 text-ink flex items-center gap-1 group" href="#features">
                      Voir la galerie <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </a>
                  </div>
                </div>

                {/* Hero Visuals */}
                <div className="flex-1 w-full relative min-h-[500px] flex items-center justify-center lg:justify-end">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-sage/10 to-transparent rounded-full blur-3xl -z-10"></div>

                  <div className="relative w-full max-w-[800px] lg:max-w-[1000px] aspect-[1/1.2] md:aspect-[16/9] flex items-center justify-center mt-[-20px] md:mt-0">
                    {/* CSS Canvas Mockup */}
                    <div className="absolute lg:relative top-0 md:top-1/2 lg:top-auto md:-translate-y-1/2 lg:-translate-y-0 right-[-5%] md:right-0 lg:right-auto w-[95%] sm:w-[85%] md:w-[80%] lg:w-[90%] max-w-[700px] aspect-[4/3] bg-white rounded-2xl shadow-float border border-paper-dark overflow-hidden flex flex-col transform rotate-[2deg] transition-transform duration-700 hover:rotate-[0deg] z-0 mx-auto">
                      {/* Header */}
                      <div className="h-10 md:h-12 border-b border-paper-dark bg-paper/50 backdrop-blur-sm flex items-center justify-between px-3 md:px-4 shrink-0">
                        <div className="flex gap-2 md:gap-3 items-center">
                          <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-sage flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-[12px] md:text-[14px] text-white">brush</span></div>
                          <div className="w-16 md:w-24 lg:w-32 h-2 bg-ink/10 rounded-full"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-black/5 hidden md:block"></div>
                          <div className="w-12 h-6 md:w-16 md:h-8 rounded-full bg-sage shadow-sm border border-black/5"></div>
                        </div>
                      </div>
                      {/* Workspace */}
                      <div className="flex-1 relative bg-[#fdfaf1] bg-[radial-gradient(#d1cfc7_1px,transparent_1px)] [background-size:16px_16px] md:[background-size:20px_20px]">
                        {/* Toolbar */}
                        <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 md:w-10 lg:w-12 py-2 md:py-3 bg-white rounded-xl md:rounded-2xl shadow-sm border border-black/5 flex flex-col gap-1 md:gap-2 lg:gap-3 items-center">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl bg-sage/10 text-sage flex items-center justify-center"><span className="material-symbols-outlined text-[14px] md:text-[16px]">near_me</span></div>
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl hover:bg-black/5 flex items-center justify-center"><span className="material-symbols-outlined text-[14px] md:text-[16px] text-ink/60">brush</span></div>
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl hover:bg-black/5 flex items-center justify-center"><span className="material-symbols-outlined text-[14px] md:text-[16px] text-ink/60">image</span></div>
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl hover:bg-black/5 flex items-center justify-center"><span className="material-symbols-outlined text-[14px] md:text-[16px] text-ink/60">sticky_note_2</span></div>
                        </div>
                        {/* Canvas Elements */}
                        <div className="absolute top-6 md:top-10 left-16 md:left-24 w-40 md:w-56 lg:w-64 h-auto bg-[#fffde7] rotate-[-4deg] shadow-md p-3 md:p-5 flex flex-col border border-black/5 transition-transform hover:scale-105 hover:rotate-0 cursor-pointer">
                          <div className="w-16 md:w-24 h-4 md:h-6 bg-red-200/40 absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 rotate-2 backdrop-blur-sm"></div>
                          <p className="font-handwriting text-ink leading-tight text-sm md:text-xl mb-1 md:mb-3">Mots d&apos;ordre :</p>
                          <ul className="font-handwriting text-ink/80 text-xs md:text-base list-disc pl-4 md:pl-6 space-y-1 md:space-y-2">
                            <li>Créativité</li>
                            <li>Inspiration libre</li>
                            <li>Sans limites</li>
                          </ul>
                        </div>
                        <div className="absolute bottom-4 md:bottom-8 right-6 md:right-12 w-36 md:w-52 lg:w-64 h-40 md:h-56 lg:h-72 bg-white shadow-lg rotate-[6deg] p-1 md:p-2 border border-black/5 transition-transform hover:scale-105 hover:rotate-2 cursor-pointer z-10">
                          <div className="w-full h-full bg-gray-100 overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&fit=crop" className="w-full h-full object-cover sepia-[.2]" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>
                        </div>
                        {/* Drawn Arrow */}
                        <div className="absolute top-24 md:top-36 left-24 md:left-40 lg:left-48 w-16 md:w-24 lg:w-32 h-16 md:h-24 lg:h-32 opacity-40">
                          <svg viewBox="0 0 100 100" fill="none" stroke="#6B8E6B" strokeLinecap="round" strokeLinejoin="round" className="rotate-[-20deg] stroke-[3px] md:stroke-[4px]">
                            <path d="M10,90 Q40,10 90,10 M70,10 L90,10 L90,30" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Galerie de Classeurs */}
          <section className="py-24 bg-paper-dark/30 relative overflow-hidden min-h-[800px] flex items-center justify-center">
            {/* Top fade */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-paper to-transparent z-[1] pointer-events-none"></div>
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-[1] pointer-events-none"></div>
            {/* Infinite Marquee Background */}
            <div className="absolute inset-0 flex flex-col justify-center items-center gap-4 rotate-[-10deg] scale-[1.3] md:scale-150 pointer-events-none z-0">
              {renderMarqueeRow(false)}
              {renderMarqueeRow(true)}
              {renderMarqueeRow(false)}
              {renderMarqueeRow(true)}
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-start gap-10">
              <h2 className="text-sage font-medium tracking-wide text-sm uppercase bg-white/70 backdrop-blur-md inline-block px-4 py-1.5 rounded-full border border-white/40 shadow-sm">Organisation Visuelle</h2>

              <div className="w-full flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-12 lg:gap-16 relative">
                {/* Left Column: Text + Controls */}
                <div className="flex-1 flex flex-col gap-8 text-center md:text-left">
                  <div>
                    <div className="bg-white/70 backdrop-blur-md inline-block px-6 py-5 md:px-8 md:py-6 rounded-2xl border border-white/40 shadow-float max-w-md">
                      <p className="text-3xl lg:text-4xl font-serif font-medium tracking-tight text-ink leading-snug">Une infinité de classeurs <span className="text-sage italic">sur-mesure</span>.</p>
                      <p className="mt-3 text-base leading-7 text-ink-light font-medium">
                        {"Imaginez une bibliothèque sans fin. Organisez vos projets dans des carnets virtuels magnifiquement texturés. Personnalisez le vôtre !"}
                      </p>
                    </div>
                  </div>

                  {/* Controls Panel */}
                  <div className="w-full max-w-[380px] bg-white/95 backdrop-blur-xl rounded-[2rem] p-5 lg:p-6 border border-white shadow-float flex flex-col gap-4 z-20 relative mx-auto md:mx-0">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] uppercase font-bold tracking-widest px-4 py-1 rounded-full shadow-md whitespace-nowrap">Personnalisation (Démo)</span>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-light font-semibold uppercase tracking-wide">Titre du carnet</label>
                      <input
                        type="text"
                        value={galleryBinderTitle}
                        onChange={(e) => setGalleryBinderTitle(e.target.value)}
                        className="w-full bg-paper/50 rounded-xl px-4 py-2.5 text-sm border border-paper-dark focus:border-sage focus:ring-1 focus:ring-sage text-ink font-serif transition-colors outline-none"
                        maxLength={24}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-light font-semibold uppercase tracking-wide">Couleur</label>
                      <div className="flex flex-wrap gap-2.5">
                        {["#c7bca5", "#8c443e", "#2a3b4c", "#e8e4dc", "#6B8E6B", "#f4a261", "#264653"].map(color => (
                          <button
                            key={color}
                            onClick={() => setGalleryBinderColor(color)}
                            className={`w-7 h-7 rounded-full transition-all ${galleryBinderColor === color ? 'ring-2 ring-offset-2 ring-ink scale-110 shadow-sm' : 'hover:scale-110 shadow-sm hover:ring-2 hover:ring-offset-1 hover:ring-ink/20'}`}
                            style={{ backgroundColor: color }}
                            aria-label={`Couleur ${color}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-light font-semibold uppercase tracking-wide">Texture</label>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[16px] text-ink-light opacity-40">texture</span>
                        <input
                          type="range"
                          min="0" max="0.5" step="0.05"
                          value={galleryBinderGrain}
                          onChange={(e) => setGalleryBinderGrain(parseFloat(e.target.value))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sage"
                        />
                        <span className="material-symbols-outlined text-[16px] text-ink-light">texture</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-ink-light font-semibold uppercase tracking-wide">Couverture</label>
                      <div className="flex gap-2.5">
                        {[
                          "",
                          "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=400&fit=crop",
                          "https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=400&fit=crop",
                          "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=400&fit=crop"
                        ].map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setGalleryBinderImage(img)}
                            className={`w-11 h-11 rounded-xl overflow-hidden transition-all bg-paper-dark flex items-center justify-center ${galleryBinderImage === img ? 'ring-2 ring-sage scale-105 shadow-md' : 'hover:opacity-100 hover:scale-105 opacity-80 shadow-sm'}`}
                          >
                            {img ? <img src={img} alt="texture" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-ink/30 text-[18px]">block</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hand-drawn dashed line linking controls to binder */}
                <div className="hidden md:block absolute left-[45%] lg:left-[42%] top-[55%] w-[12%] lg:w-[18%] z-20 opacity-60 pointer-events-none">
                  <svg viewBox="0 0 120 60" fill="none" className="w-full" stroke="#6B8E6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M0,35 C40,35 70,15 110,30" strokeDasharray="6 4" />
                    <path d="M100,23 L112,30 L102,38" />
                  </svg>
                </div>

                {/* Right Column: Interactive Binder */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-[260px] md:w-[320px] lg:w-[400px] aspect-[3/4] perspective-[2000px] transition-transform duration-500 hover:scale-[1.02] relative z-20">
                    <BookBinder
                      scrapbook={{
                        id: "binder-test",
                        title: galleryBinderTitle,
                        binderColor: galleryBinderColor,
                        binderGrain: galleryBinderGrain,
                        coverImage: galleryBinderImage,
                        coverZoom: 0.6,
                        coverX: 50,
                        coverY: 50,
                        showPreview: false,
                      }}
                      showDetails
                      onClick={() => {
                        setGalleryBinderOpen(!galleryBinderOpen);
                      }}
                    />
                    {/* Click indicator */}
                    <div className={`absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-1.5 font-serif text-sm bg-sage text-white px-5 py-2 rounded-full shadow-lg pointer-events-none transition-all duration-300 ${galleryBinderOpen ? 'translate-y-4 opacity-0 scale-90' : 'animate-bounce opacity-100 scale-100'}`}>
                      <span className="material-symbols-outlined text-[18px]">touch_app</span>
                      Cliquez pour ouvrir !
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features / Experience */}
          <section id="features" className="py-24 bg-white relative">
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-paper to-transparent pointer-events-none"></div>
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                  <h2 className="text-sage font-medium tracking-wide text-sm uppercase mb-3">Expérience</h2>
                  <h3 className="font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl mb-6">Donnez vie à vos idées</h3>
                  <p className="text-lg leading-8 text-ink-light font-light mb-8">
                    Un espace de travail qui simule la vraie matière. Outils de dessin avancés, post-its dynamiques, images haute résolution et classeurs ultra-personnalisables.
                  </p>

                  <div className="space-y-8">
                    <div className="flex gap-4 items-start">
                      <div className="flex-none w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage">
                        <span className="material-symbols-outlined">brush</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-ink text-lg font-serif">Outils de Dessin Pro</h4>
                        <p className="text-ink-light text-sm font-light mt-1">Palette de couleurs sur-mesure, épaisseur de trait dynamique et gomme de précision tactile.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="flex-none w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage">
                        <span className="material-symbols-outlined">sticky_note_2</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-ink text-lg font-serif">Post-its Dynamiques</h4>
                        <p className="text-ink-light text-sm font-light mt-1">Écrivez, ajustez la taille et la couleur de vos notes. Le texte s&apos;adapte parfaitement, enrichi d&apos;un grain réaliste.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="flex-none w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage">
                        <span className="material-symbols-outlined">collections_bookmark</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-ink text-lg font-serif">Classeurs Customisables</h4>
                        <p className="text-ink-light text-sm font-light mt-1">Couverture photo sticker, grain ajustable, couleurs variées. Vos carnets sont uniques depuis la bibliothèque.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2 relative h-[600px] w-full bg-paper rounded-2xl overflow-hidden border border-paper-dark shadow-inner group">
                  <div className="absolute inset-0 sketchbook-grid opacity-50"></div>

                  <div className="absolute top-[10%] left-[15%] w-72 h-44 bg-white p-3 shadow-2xl rotate-[-3deg] transition-all duration-700 hover:rotate-0 hover:scale-105 hover:shadow-float z-10 cursor-move border border-black/5">
                    <img alt="Moodboard texture" className="w-full h-full object-cover filter sepia-[.1]" src="https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=600&fit=crop" />
                    <div className="absolute -top-3 left-6 w-16 h-8 bg-white/70 backdrop-blur-sm rotate-[-8deg] shadow-sm flex items-center justify-center"><div className="w-12 h-4 bg-gray-200/50"></div></div>
                  </div>

                  <div className="absolute top-[40%] right-[10%] w-60 h-auto bg-[#e8f5e9] p-5 shadow-xl rotate-[6deg] transition-all duration-500 hover:rotate-[3deg] hover:scale-105 z-20 cursor-move border border-[#c8e6c9]">
                    <div className="w-16 h-8 bg-[#81c784]/20 absolute -top-4 right-8 rotate-[-5deg] backdrop-blur-md mix-blend-multiply"></div>
                    <h5 className="font-handwriting text-3xl text-ink leading-tight mb-2">Palette Sage</h5>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-sage shadow-inner border border-black/5"></div>
                      <div className="w-8 h-8 rounded-full bg-[#3a4a3a] shadow-inner border border-black/5"></div>
                      <div className="w-8 h-8 rounded-full bg-[#fdfaf1] shadow-inner border border-black/5"></div>
                    </div>
                  </div>

                  <div className="absolute bottom-[20%] left-[20%] w-56 h-auto bg-[#fffde7] p-4 shadow-xl rotate-[-4deg] transition-all duration-500 hover:rotate-[0deg] z-20 cursor-move">
                    <div className="w-32 h-8 bg-pink-200/50 absolute -top-4 left-1/2 -translate-x-1/2 rotate-1 backdrop-blur-sm"></div>
                    <p className="font-handwriting text-2xl text-ink leading-snug">Ranger et trier les assets pour la presentation de demain !</p>
                  </div>

                  {/* Drawn path */}
                  <svg className="absolute top-[25%] left-[45%] w-48 h-48 opacity-60 z-15 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="#6B8E6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10,10 Q50,90 90,50" />
                    <path d="M80,45 L90,50 L85,60" />
                  </svg>

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-full px-6 py-3 flex gap-6 border border-gray-100">
                    <button className="hover:text-sage transition-colors"><span className="material-symbols-outlined">undo</span></button>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <button className="hover:text-sage transition-colors"><span className="material-symbols-outlined">image</span></button>
                    <button className="hover:text-sage transition-colors"><span className="material-symbols-outlined">text_fields</span></button>
                    <button className="hover:text-sage transition-colors text-sage"><span className="material-symbols-outlined">brush</span></button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Esthétique */}
          <section className="py-24 bg-paper relative">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-sage font-medium tracking-wide text-sm uppercase mb-3">Esthétique</h2>
                <h3 className="font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl">Une âme analogique</h3>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="col-span-1 lg:col-span-2 bg-white rounded-3xl p-8 border border-paper-dark shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 bg-sage/5 rounded-bl-full -mr-16 -mt-16 z-0"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 h-full">
                    <div className="flex-1 space-y-4">
                      <h4 className="font-serif text-2xl font-bold text-ink">Effet Bords Brûlés</h4>
                      <p className="text-ink-light">Nos algorithmes génèrent procéduralement des bords vieillis, brûlés ou déchirés pour chaque image. Aucun doublon, chaque texture est unique.</p>
                      <div className="flex gap-2 mt-4">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider rounded-full">Exclusif</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full flex justify-center">
                      <div className="relative w-64 h-64">
                        <div className="absolute inset-0 bg-[#f8f5f0] shadow-2xl rotate-3 p-2 burnt-edge overflow-hidden rounded-sm">
                          <img alt="Texture papier" className="w-full h-full object-cover opacity-80 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtseUCbljV07eM8W4TshhEEFyHVScYuuhUk-CE8_JhtNYnWuRhOwnhOfj5gSAwlP7jvHQC423DnfvzIcIIToVgzGfLC5hVVmdA-R6901BbwS91JlXwq0v6BbigV1iapGJVPwAbCj7M591QH4FDQaKbZ-yBnHixAgRsCRtccvIP3pQVMozy-rRime_BxuOasVpRKanjJtytLBmDIOe15pkIPaHOx7tGpgbbl3x0EJtgglh_0xfWhPx7WZVurQEz-jkW0gtxHu97aHBR" />
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white rounded-full border-4 border-sage/20 shadow-xl flex items-center justify-center overflow-hidden z-20">
                          <div className="w-[200%] h-[200%] bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAtseUCbljV07eM8W4TshhEEFyHVScYuuhUk-CE8_JhtNYnWuRhOwnhOfj5gSAwlP7jvHQC423DnfvzIcIIToVgzGfLC5hVVmdA-R6901BbwS91JlXwq0v6BbigV1iapGJVPwAbCj7M591QH4FDQaKbZ-yBnHixAgRsCRtccvIP3pQVMozy-rRime_BxuOasVpRKanjJtytLBmDIOe15pkIPaHOx7tGpgbbl3x0EJtgglh_0xfWhPx7WZVurQEz-jkW0gtxHu97aHBR')] bg-cover bg-center scale-150 brightness-110 contrast-125"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#f0ece3] rounded-3xl p-8 border border-paper-dark shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-40"></div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 text-sage">
                      <span className="material-symbols-outlined">texture</span>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-ink mb-2">Grain Papier 800DPI</h4>
                    <p className="text-sm text-ink-light">Scans haute résolution de papiers rares : Canson, aquarelle, Kraft, et plus encore.</p>
                  </div>
                  <div className="mt-8 relative h-32 w-full rounded-lg overflow-hidden shadow-inner border border-gray-200/50">
                    <img alt="Texture papier zoom" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDc8tAkaINvGiyMendbdq3b6OSlE4swTgc5hwDULXgMHIdqLHclEpDw7SOjcwXYirOMFeYJ6PdZ2Pyk8PJJlMxXUdEE6jTcU_0Di2UkDDmjTlqly1AGyTnZSjqdz6b_r6GYqIUWw-s8e_pxGjF0pHT7FnswGaEgbquvmFhrZYXh5fr-5NxFybGY6VLFvYIxFzs_MQUvDGklPHAmXYshfXuxCeUIs5aNq4KGQ3vA10ocdxNEzXvufFXWg1qnuyXQkUNzr5oz5hjspyJK" />
                  </div>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-8 mt-8">
                <div className="bg-white rounded-3xl p-8 border border-paper-dark shadow-sm flex flex-col justify-between relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-sage/10 rounded-full flex items-center justify-center shadow-sm mb-6 text-sage">
                      <span className="material-symbols-outlined">edit_note</span>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-ink mb-2">Typos Manuscrites</h4>
                    <p className="text-sm text-ink-light">Une collection de polices cursives imparfaites pour donner du caractère à vos notes.</p>
                  </div>
                  <div className="mt-6 space-y-2">
                    <p className="font-handwriting text-2xl text-ink">Chère journal...</p>
                    <p className="font-serif italic text-lg text-ink/70">Idées pour demain</p>
                    <p className="font-mono text-xs text-ink/50 uppercase tracking-widest">Note rapide</p>
                  </div>
                </div>
                <div className="col-span-1 lg:col-span-2 bg-[#e8f5e9] rounded-3xl p-8 border border-sage/20 shadow-sm relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#6B8E6B_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>
                  <div className="flex flex-wrap justify-center items-center gap-6 relative z-10">
                    <div className="bg-white p-2 rounded shadow-md rotate-[-6deg] hover:rotate-0 transition-transform duration-300 cursor-pointer">
                      <span className="material-symbols-outlined text-4xl text-orange-400">local_cafe</span>
                    </div>
                    <div className="bg-yellow-200 px-4 py-1 rounded-full shadow-md rotate-[3deg] hover:rotate-0 transition-transform duration-300 border border-yellow-300/50">
                      <span className="font-handwriting font-bold text-yellow-800">Important !</span>
                    </div>
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg rotate-12 hover:rotate-0 transition-transform duration-300">
                      <img alt="texture" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBq3W0K44iD_5eD8yWfQF5Y_u1H4Io_QM8igfS66uhHTf-AEtIglT7SMXfKDHXSDD2V4bEhJPDqQnddsNl9rRBLTFWdSEv-a4haCU156Lf7xsBaGCtFkKGZzyYmd-ttXh5MxGZKRimA8U32wBqun8UgaX5wDLcaYfEUf71SEiWHQP_mC8ghWZbLU4hOSrluWGOd0sicF1EwXCgmQyTJ3igVsCnOavh4a6EyiwD4diYZc9tv2W1-O8k47ldf57kHrbkZNJHGDVOl2ew9" />
                    </div>
                    <div className="bg-blue-100 p-2 rounded shadow-md rotate-[-3deg] hover:rotate-0 transition-transform duration-300">
                      <span className="material-symbols-outlined text-4xl text-blue-400">flight</span>
                    </div>
                    <div className="w-32 h-8 bg-white/60 backdrop-blur-sm border-l-2 border-r-2 border-dashed border-gray-300 rotate-[-2deg] hover:rotate-0 transition-transform shadow-sm"></div>
                  </div>
                  <div className="text-center mt-6 z-10">
                    <h4 className="font-serif text-xl font-bold text-ink mb-1">Bibliothèque de Stickers</h4>
                    <p className="text-sm text-ink-light">{"Des centaines d'éléments pour personnaliser vos pages."}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* Call to Action */}
          <section className="relative isolate overflow-hidden py-24 sm:py-32 m-4 lg:m-8 rounded-[3rem] bg-[#1a2a1a] border border-[#2a3a2a] shadow-2xl">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stucco.png')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-sage/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-orange-900/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
              <div className="mx-auto max-w-2xl text-center">
                <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-white/80 text-xs font-mono mb-6 border border-white/5 backdrop-blur-md">/ L&apos;ATELIER VOUS ATTEND /</span>
                <h2 className="text-4xl font-serif font-medium tracking-tight text-white sm:text-6xl mb-6 drop-shadow-md">
                  Prêt à commencer votre carnet ?
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300 font-light mb-10">
                  Rejoignez des créatifs qui trouvent leur flow dans Scrappi. Démarrez dès maintenant avec un projet gratuit et laissez parler votre imagination.
                </p>
                <Link
                  href={user ? "/library" : "/login"}
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-lg font-semibold text-[#1a2a1a] shadow-xl hover:bg-gray-100 hover:scale-105 transition-all duration-300 group"
                >
                  {user ? "Accéder à mon atelier" : "Créer gratuitement"}
                  <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </Link>
                <p className="mt-8 text-sm text-gray-400 font-handwriting opacity-80 rotate-[-1deg]">Aucune carte de crédit requise.</p>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-white/80 backdrop-blur-md border border-paper-dark rounded-[2rem] mx-4 lg:mx-8 mb-4 pt-12 pb-8 shadow-sm">
          <div className="mx-auto max-w-7xl px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12">
              <div className="flex flex-col gap-4 md:col-span-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage text-white shadow-sm">
                    <span className="material-symbols-outlined text-[18px]">brush</span>
                  </div>
                  <span className="font-serif text-2xl font-semibold text-ink">Scrappi</span>
                </div>
                <p className="text-sm text-ink-light font-light leading-relaxed max-w-sm">
                  Le sanctuaire numérique pour votre processus créatif. Capturez l&apos;imprévu, cultivez l&apos;inspiration.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink">Réseaux</h3>
                <div className="flex flex-col gap-3">
                  <a href="https://github.com/Moussandou" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-ink-light hover:text-sage transition-colors group">
                    <svg className="w-4 h-4 fill-current group-hover:-translate-y-0.5 transition-transform" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                    GitHub
                  </a>
                  <a href="https://www.linkedin.com/in/moussandou/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-ink-light hover:text-sage transition-colors group">
                    <svg className="w-4 h-4 fill-current group-hover:-translate-y-0.5 transition-transform" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                    LinkedIn
                  </a>
                  <a href="https://moussandou.github.io/Portfolio/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-ink-light hover:text-sage transition-colors group">
                    <span className="material-symbols-outlined text-[16px] group-hover:-translate-y-0.5 transition-transform">language</span>
                    Portfolio
                  </a>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-ink">Informations</h3>
                <div className="flex flex-col gap-3">
                  <Link href="/credits" className="text-sm text-ink-light hover:text-sage transition-colors">Crédits</Link>
                  <Link href="/legal#mentions" className="text-sm text-ink-light hover:text-sage transition-colors">Mentions Légales</Link>
                  <Link href="/legal#privacy" className="text-sm text-ink-light hover:text-sage transition-colors">Confidentialité</Link>
                </div>
              </div>
            </div>

            <div className="border-t border-paper-dark pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[10px] uppercase tracking-widest text-ink-light">© 2026 Scrappi Inc. par Moussandou. Tous droits réservés.</p>
              <div className="flex gap-6">
                <span className="text-[10px] text-ink-light/50 italic">Fait avec amour et papier numérique.</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div >
  );
}
