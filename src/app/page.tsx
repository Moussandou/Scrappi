import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="bg-paper text-ink font-display overflow-x-hidden selection:bg-sage selection:text-white">
      <div className="paper-grain"></div>

      <div className="relative flex min-h-screen w-full flex-col group/design-root">
        <header className="sticky top-0 z-40 w-full transition-all duration-300 bg-paper/90 backdrop-blur-sm border-b border-paper-dark">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage text-white shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">brush</span>
                </div>
                <span className="font-serif text-2xl font-semibold tracking-tight text-ink">Atelier</span>
              </div>
              <nav className="hidden md:flex items-center gap-10">
                <Link className="text-sm font-light text-ink-light hover:text-sage transition-colors" href="/library">Bibliothèque</Link>
                <a className="text-sm font-light text-ink-light hover:text-sage transition-colors" href="#">Fonctionnalités</a>
                <a className="text-sm font-light text-ink-light hover:text-sage transition-colors" href="#">Tarifs</a>
              </nav>
              <div className="flex items-center gap-4">
                <a className="hidden text-sm font-medium text-ink-light hover:text-ink md:block" href="#">Connexion</a>
                <Link href="/library" className="flex items-center justify-center rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-all hover:bg-opacity-90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2">
                  Créer gratuitement
                </Link>
              </div>
            </div>
          </div>
        </header>

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
                    Atelier : Votre <br />
                    <span className="italic text-sage">Carnet Créatif Infini</span>
                  </h1>
                  <p className="mt-6 text-lg leading-8 text-ink-light font-light max-w-lg mx-auto lg:mx-0">
                    Redécouvrez le plaisir tactile du papier dans un espace numérique sans limites. Créez des moodboards, journaux et collages avec une âme analogique.
                  </p>
                  <div className="mt-10 flex items-center justify-center lg:justify-start gap-x-6">
                    <Link href="/library" className="rounded-full bg-sage px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-opacity-90 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage">
                      Commencer à créer
                    </Link>
                    <a className="text-sm font-semibold leading-6 text-ink flex items-center gap-1 group" href="#features">
                      Voir la galerie <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">arrow_forward</span>
                    </a>
                  </div>
                </div>

                {/* Hero Visuals */}
                <div className="flex-1 w-full relative min-h-[500px] flex items-center justify-center lg:justify-end">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-sage/10 to-transparent rounded-full blur-3xl -z-10"></div>

                  <div className="relative w-full max-w-[500px] aspect-square">
                    {/* Main Polaroid */}
                    <div className="absolute top-10 left-10 w-3/4 h-3/4 bg-[#fcfcfc] rounded-sm shadow-float rotate-[-6deg] p-6 flex flex-col items-center justify-center z-10 burnt-edge transform transition-transform hover:scale-[1.02] duration-500">
                      <div className="w-full h-full border-2 border-dashed border-gray-200 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                        <p className="font-serif italic text-2xl text-gray-300 absolute top-4 left-4">Projet N°04</p>
                        <div className="w-full h-full flex flex-wrap content-center gap-2 opacity-10">
                          <div className="w-full h-2 bg-black rounded-full"></div>
                          <div className="w-3/4 h-2 bg-black rounded-full"></div>
                          <div className="w-5/6 h-2 bg-black rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Polaroid */}
                    <div className="absolute top-0 right-4 w-64 bg-white p-3 pb-8 shadow-2xl rotate-[4deg] z-20 animate-float-delayed hover:rotate-6 transition-transform">
                      <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 relative">
                        <img alt="Photo artistique" className="h-full w-full object-cover sepia-[.3]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyetwpAH_UbgWjf8AN1pvblXr04wz5Hjg9nZvayATytnj_AYH0TELnnjwZb3Ryt5kN2Ez4GlZ2FHqU9GIhCFPCDwoKYp-MKeTivArCH6GiXopdO6pf_BS5fgaHHAzm6TtMzOLLCPYDDs2Rw-mctLo-pcv6JOYem-yblxjBjQWAWut7TeRTafNlvNo8ixtDMtxW-mMPrJ-M268_KeY9YW5vJrGJfjRfcGEaEQ0B7WckphpgGTmSeNBLu4JJ7QXLP1zgspbIfnSPmv2n" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-50"></div>
                      </div>
                      <div className="mt-4 font-handwriting text-center text-gray-600 text-xl rotate-[-2deg]">Souvenirs d'été</div>
                    </div>

                    {/* Sticky Note */}
                    <div className="absolute bottom-20 left-0 bg-[#FFF9C4] w-56 p-6 shadow-lg rotate-[-3deg] z-30 animate-float rounded-sm transform transition-transform hover:rotate-0 duration-300">
                      <div className="w-8 h-8 rounded-full bg-sage/20 absolute -top-3 left-1/2 -translate-x-1/2 backdrop-blur-sm border border-white/50 shadow-sm"></div>
                      <p className="font-handwriting text-ink text-2xl leading-tight">"La créativité, c'est l'intelligence qui s'amuse."</p>
                      <div className="mt-2 flex gap-1 justify-end">
                        <span className="material-symbols-outlined text-yellow-600 text-sm">star</span>
                        <span className="material-symbols-outlined text-yellow-600 text-sm">star</span>
                        <span className="material-symbols-outlined text-yellow-600 text-sm">star</span>
                      </div>
                    </div>

                    {/* Tape & Sticker */}
                    <div className="absolute top-6 right-20 w-24 h-8 bg-white/40 rotate-[45deg] z-30 backdrop-blur-[2px] shadow-sm border border-white/20"></div>
                    <div className="absolute bottom-10 right-10 w-16 h-16 bg-orange-300 rounded-full z-20 flex items-center justify-center shadow-lg rotate-12 text-white font-bold text-xs uppercase tracking-widest border-2 border-white border-dashed">
                      Art
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Galerie de Classeurs */}
          <section className="py-24 bg-sage/5 border-t border-paper-dark relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-sage font-medium tracking-wide text-sm uppercase mb-3">Organisation Visuelle</h2>
                <p className="mt-2 text-4xl font-serif font-medium tracking-tight text-ink sm:text-5xl">Galerie de Classeurs</p>
                <p className="mt-6 text-lg leading-8 text-ink-light font-light">
                  Organisez vos projets dans des classeurs virtuels magnifiquement texturés. Une bibliothèque visuelle qui inspire avant même d'ouvrir une page.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                <div className="group relative aspect-[3/4] bg-[#e8e4dc] rounded-r-2xl rounded-l-sm shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-l-8 border-l-[#8B4513] overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30"></div>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white px-6 py-4 shadow-sm border border-gray-200 rotate-1 min-w-[140px] text-center">
                    <h3 className="font-serif text-lg text-ink font-semibold">Voyages 2023</h3>
                    <p className="text-xs text-ink-light mt-1 font-mono">12 pages</p>
                  </div>
                  <div className="absolute bottom-0 w-full h-1/2 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button className="bg-sage text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">Ouvrir</button>
                  </div>
                </div>
                <div className="group relative aspect-[3/4] bg-[#3a4a3a] rounded-r-2xl rounded-l-sm shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-l-8 border-l-[#1a2a1a] overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/30 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/canvas-orange.png')] opacity-20"></div>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#f0f0f0] px-6 py-4 shadow-sm border border-gray-300 -rotate-1 min-w-[140px] text-center">
                    <h3 className="font-serif text-lg text-ink font-semibold">Architecture</h3>
                    <p className="text-xs text-ink-light mt-1 font-mono">45 pages</p>
                  </div>
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-300"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-0 w-full h-1/2 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button className="bg-white text-ink px-4 py-2 rounded-full text-sm font-medium shadow-md">Ouvrir</button>
                  </div>
                </div>
                <div className="group relative aspect-[3/4] bg-[#c7bca5] rounded-r-2xl rounded-l-sm shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border-l-8 border-l-[#8c7b5d] overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/10 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white px-6 py-4 shadow-sm border border-gray-200 rotate-0 min-w-[140px] text-center">
                    <h3 className="font-serif text-lg text-ink font-semibold">Recettes</h3>
                    <p className="text-xs text-ink-light mt-1 font-mono">8 pages</p>
                  </div>
                  <div className="absolute bottom-12 right-8 w-16 h-16 opacity-80 rotate-12">
                    <img alt="sticker" className="w-full h-full drop-shadow-md grayscale-[0.2]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8Y62fXPRBtycv8JUpjQAYzwN0KvhWHTYyoUKhAdnuCKlnv20vCxEEj-d2k0sTOZC5RKn-FOPavQkqTFxN0fEHSZc2lDHXDPx8SgJufdYEEd56dZHqI_c6Xwaw9c3eF-7QlEnF91sc-igvX7yzVkciARQrvfdVA8T0SBmBZFJIGzz2BLHV8SBIW8F-CEGr2USAAjGXzReNXQiepM6_JRDb9i8Uy-N4HbC0FopiGRJilpR_dJJ2URFk09WZCwJBpt6tVZ3c6CY5x2Wp" />
                  </div>
                  <div className="absolute bottom-0 w-full h-1/2 flex items-end justify-center pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button className="bg-sage text-white px-4 py-2 rounded-full text-sm font-medium shadow-md">Ouvrir</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features / Experience */}
          <section id="features" className="py-24 bg-white border-t border-paper-dark relative">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                  <h2 className="text-sage font-medium tracking-wide text-sm uppercase mb-3">Expérience</h2>
                  <h3 className="font-serif text-4xl font-medium tracking-tight text-ink sm:text-5xl mb-6">Donnez vie à vos idées</h3>
                  <p className="text-lg leading-8 text-ink-light font-light mb-8">
                    Un espace de travail qui respire. Glissez, déposez, superposez. Notre moteur de rendu simule la texture des matériaux et abolit les limites fixes.
                  </p>

                  <div className="space-y-8">
                    <div className="flex gap-4 items-start">
                      <div className="flex-none w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage">
                        <span className="material-symbols-outlined">all_inclusive</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-ink text-lg font-serif">Canvas Infini</h4>
                        <p className="text-ink-light text-sm font-light mt-1">Ne soyez jamais à court de place. Le canvas s'étend au fur et à mesure que votre imagination grandit.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="flex-none w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage">
                        <span className="material-symbols-outlined">auto_fix</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-ink text-lg font-serif">Stickers & Washi Tape</h4>
                        <p className="text-ink-light text-sm font-light mt-1">Une collection d'éléments interactifs et texturés pour enrichir la mise en page de vos boards.</p>
                      </div>
                    </div>

                    <div className="flex gap-4 items-start">
                      <div className="flex-none w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center text-sage">
                        <span className="material-symbols-outlined">gesture</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-ink text-lg font-serif">Liberté Totale</h4>
                        <p className="text-ink-light text-sm font-light mt-1">Pas de grilles rigides. Placez, rotationnez et superposez vos éléments où vous le souhaitez.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2 relative h-[600px] w-full bg-paper rounded-2xl overflow-hidden border border-paper-dark shadow-inner group">
                  <div className="absolute inset-0 sketchbook-grid opacity-50"></div>

                  <div className="absolute top-1/4 left-1/4 w-64 h-80 bg-white p-3 pb-12 shadow-2xl rotate-[-6deg] transition-all duration-700 hover:rotate-[-8deg] hover:scale-105 hover:shadow-float z-10 cursor-move">
                    <img alt="Fleurs séchées" className="w-full h-full object-cover filter contrast-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXKcfyU9fLGCdUkGvUF-et91p1N9b2bjuEcnAn46efxmhWAFNq_x1osOjQatdFLNVoKQtxvYW83D3czG3TS2-w6aNuLM-ofhlghZELGftBlVBntgW_TWEo7AnB-BEHN79f_ejJjBNTnckIH-qzcuRMFkSJPDLWXJKSFMfAp5K2xp9J0iSmTPfrmQ6qLv01pzIVeI8PhJaftcGyB-e0SyTvGPU4TOt97GiPM7ymK2_-gskGW9eh9JoZWRXWSGPPbfPWNg4XZ9PFA1WV" />
                  </div>

                  <div className="absolute bottom-1/4 right-1/4 w-56 h-auto bg-[#fffde7] p-4 shadow-xl rotate-[3deg] transition-all duration-500 hover:rotate-[0deg] z-20 cursor-move">
                    <div className="w-32 h-8 bg-pink-200/50 absolute -top-4 left-1/2 -translate-x-1/2 rotate-1 backdrop-blur-sm"></div>
                    <p className="font-handwriting text-2xl text-ink leading-snug">Ranger et trier les assets pour la presentation de demain !</p>
                  </div>

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

          {/* Call to Action */}
          <section className="relative isolate overflow-hidden py-24 sm:py-32 bg-sage/5 border-t border-paper-dark">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-serif font-medium tracking-tight text-ink sm:text-4xl">Prêt à commencer votre carnet ?</h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-ink-light font-light">
                  Rejoignez des créatifs qui trouvent leur flow dans Atelier. Démarrez dès maintenant avec un projet gratuit.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link href="/library" className="rounded-full bg-sage px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage transition-all hover:-translate-y-1">
                    Créer gratuitement
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="bg-paper border-t border-paper-dark">
          <div className="mx-auto max-w-7xl overflow-hidden px-6 py-12 sm:py-16 lg:px-8 text-center">
            <p className="text-xs leading-5 text-ink-light">© 2026 Atelier / Scrappi Inc. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
