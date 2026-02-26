"use client";

import React from 'react';
import Image from 'next/image';

export default function EmptyProjectState() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 select-none">
            <div className="relative w-64 h-64 mb-8">
                <Image
                    src="/assets/images/empty_watermark.png"
                    alt="Empty Canvas"
                    fill
                    className="object-contain grayscale"
                />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-serif text-ink italic">Votre carnet est prêt...</h2>
                <p className="text-sm text-ink-light font-medium tracking-wide">Faites glisser des photos ou commencez à dessiner</p>
                <div className="flex items-center justify-center gap-6 mt-8">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="size-10 rounded-full bg-sage/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sage text-[20px]">image</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Photos</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="size-10 rounded-full bg-sage/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sage text-[20px]">draw</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Dessin</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="size-10 rounded-full bg-sage/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-sage text-[20px]">sticky_note_2</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Notes</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
