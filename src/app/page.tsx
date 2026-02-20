"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createScrapbook, getScrapbooks } from "@/infra/db/firestoreService";
import { Scrapbook } from "@/domain/entities";

export default function LibraryOverview() {
  const router = useRouter();
  const [scrapbooks, setScrapbooks] = useState<Scrapbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchScrapbooks() {
      try {
        const data = await getScrapbooks();
        setScrapbooks(data);
      } catch (error) {
        console.error("Failed to fetch scrapbooks, maybe Firebase is not configured?", error);
      } finally {
        setLoading(false);
      }
    }
    fetchScrapbooks();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const newScrapbook = await createScrapbook("Nouveau Classeur");
      router.push(`/project/${newScrapbook.id}`);
    } catch (error) {
      console.error("Error creating scrapbook:", error);
      alert("Erreur lors de la création du classeur. Vérifiez votre configuration Firebase.");
      setCreating(false);
    }
  };
  return (
    <div className="bg-background-light text-slate-900 font-sans overflow-hidden h-screen w-screen flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 z-50 bg-background-light/80 backdrop-blur-sm border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            <span className="material-symbols-outlined !text-3xl">compost</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Infinite Creative Canvas</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-cover bg-center border-2 border-white shadow-sm cursor-pointer" style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')" }}></div>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden group/canvas">
        <div className="absolute inset-0 w-full h-full texture-overlay z-0 mix-blend-multiply opacity-50"></div>

        <aside className="w-72 bg-white/60 backdrop-blur-md border-r border-primary/10 flex flex-col z-40 transition-transform h-full shadow-paper">
          <div className="p-4 border-b border-primary/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Mes Classeurs</h2>
              <button className="text-primary hover:bg-primary/10 rounded-full p-1 transition-colors">
                <span className="material-symbols-outlined !text-xl">add</span>
              </button>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 !text-lg">search</span>
              <input className="w-full pl-9 pr-4 py-2 bg-white border border-primary/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Rechercher..." type="text" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <div className="grid grid-cols-2 gap-2">
                {loading ? (
                  <div className="text-sm text-slate-500 col-span-2 text-center py-4">Chargement...</div>
                ) : scrapbooks.map(scrapbook => (
                  <Link key={scrapbook.id} href={`/project/${scrapbook.id}`} className="aspect-square rounded-lg bg-cover bg-center cursor-pointer hover:opacity-80 transition-opacity shadow-sm flex items-end p-2" style={{ backgroundImage: scrapbook.coverImage ? `linear-gradient(to top, rgba(0,0,0,0.6), transparent), url('${scrapbook.coverImage}')` : "linear-gradient(to top, rgba(0,0,0,0.6), transparent), url('https://images.unsplash.com/photo-1542435503-956c22dd1ce7?q=80&w=200') " }}>
                    <span className="text-white text-xs font-bold shadow-sm">{scrapbook.title}</span>
                  </Link>
                ))}

                <button onClick={handleCreate} disabled={creating} className="aspect-square rounded-lg bg-slate-200 cursor-pointer hover:bg-slate-300 transition-colors shadow-sm flex flex-col items-center justify-center text-slate-500 disabled:opacity-50">
                  <span className="material-symbols-outlined mb-1">{creating ? "hourglass_empty" : "add_circle"}</span>
                  <span className="text-xs font-semibold">Nouveau</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 relative overflow-auto bg-transparent z-0 flex items-center justify-center">
          <div className="text-center p-8 bg-white/40 backdrop-blur-sm rounded-xl border border-primary/10 shadow-sm max-w-md mx-4">
            <span className="material-symbols-outlined text-border-primary/50 text-6xl mb-4 text-primary opacity-80">book_2</span>
            <h2 className="text-2xl font-hand mb-2 text-slate-800">Bienvenue dans SCRAPPI</h2>
            <p className="text-slate-600 mb-6 font-sans">Sélectionnez un classeur dans la bibliothèque ou créez-en un nouveau pour commencer à organiser vos idées.</p>
            <button onClick={handleCreate} disabled={creating} className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-md transition-transform hover:scale-105 disabled:opacity-50">
              {creating ? "Création..." : "Créer un classeur"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
