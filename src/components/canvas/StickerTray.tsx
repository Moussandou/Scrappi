"use client";

import Image from "next/image";

interface StickerTrayProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSticker: (url: string) => void;
}

const STICKERS = [
    { id: "s1", alt: "Vintage botanical illustration", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKFpEydrB7v4sm9-liV2wZNByQRE_jordTwhlpRV37iYgeB-3yOMWASZInRn09cdxEiGTOAr6rZQV38duYlKtTacUnEMBBYuNTcrX6e0x_c4kN78S_Uk75O00nz-9alb7RR072hIkW6vSULA-j2jxBP8IR2b0sIVxFpsw1YqU0fRlwzkFAD9JcYXU6rSH3P9j5Bg6dO8cE-hczpnFwE-qZfPIM0xdBhHW8Gox6FbBcmNpCpYDB0f7Vu_hWQiFZMznQsJzFzNS53Bwp" },
    { id: "s2", alt: "Vintage postage stamps", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuzyLuuvOO6bb4B8DXfoZe20INFaO9Dc8dvfDyF-JGoNG5Zm2QyqUEXYcv6NEnhSk6f0Fzvj_BV8ZNFe8A4YHkgbTcWfTglKreBzzJ99k6cmBpdeElebIC-h7D7Wmmsy8VEmyff_mz61NCQHG2aoCj9zVvXnpzK0dMFlWBOg7bxZGqgihVajDJJORGZAWgseplMPQthGpP4BvAYk9GayYp9FUEoBds-NSt9wTf-kPOm9kJ_jve5eykpdDl8ni7LlwuZrBlQbZaXhFO" },
    { id: "s3", alt: "Washi tape strips", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-MPtOuNAdW30U8rJ3zBOPra5LBEHAD4DeBIwZSq8Mcs3AmoAL2GiftZGyZIsU7vGgqleR37ikzBAX3QH32kLoIgxIZJJPAD9uffLtaUUb1XAz2T03ttzslijKSCxaaPTb-Hrcl91CvMO3Qu09DZA-jZT97NXtGQxcvBc_gfTTAqF-US4JySDz9Le9Mc2yqpvGM0q100VYyGJnnYoQ19LjRC-laYcTGzY2Zu3hd6KtzFAoQxupPrvlWKt19d8QkVHoMKWoImjVBjUw" },
    { id: "s4", alt: "Mushroom sketch", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDVhwzGBpLxepzbPzqhYvf__RmmvQXnT8brx6KTaIkRyVicRkMcMj9w_v-ESJ23c5rgwX_t1IAQ-kLtIXR1M7QqurRjphR9scewtJIgNrfnTepNGU_E1VDOj1uyKpT8-ACNlmAhRdvHcbFZi4CxNJo6cOO3yzRVzAlb2mA8DNkUz3_KXUaDTzMUvrQqCXypslu8IlpTXpAT0aUc7M-by-fcssJ_w8YNrIGVWkVAWTtq_1ixawWknMu4vGbASdd6IHVW9iuc-hsUN4zm" },
    { id: "s5", alt: "Red wax seal", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBihonf677afbH-tsVBWpgDigLy8oCQs9mpPOlz73-DcVISoNCJ-qU_N_pgkhubglDC8rvLEvdYDgraD20ugc8yRfK3TEHde5_BjAM4pO0jT2Md2To2qGTouYSsAJ0wAJQHmPcrl7IfqQ5qAmAJ1e3GiTshSjxoZ9QvGx1lK17DN5CxuyDV1fuyAQEqSUxzlvY1tYLA3qpynM1iOS9HpDgr4uL96cnKb_QGMMqZBZL4G1oqGrwaGInzEXWlayjcaaI4IQXQ5C0BEfoy" },
    { id: "s6", alt: "Dried flower bouquet", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuArX589FSyVn8adV3tkmCv-T-bE7tKY9mV2PV-6ZJpO8T-gKerG_wPZ66gHwqYZId3WUMNghWmrTukkRHFD5w1Mxn7IXZB6xZHjZYAGHRDrD27izMkoO3USPSfHraqM-I2tBsl_PE5AQ3MHiTC7UA8ksj9dMx3sjtbx-yOTXWQGRgkzwYwDkX-D7dTThLQDEMuvXx1NHejgvLL5c98-YcM5SfB_5qV3cJVjtcSsQhis-l8yU6mtAyF2hBt2aWy_3iKXJsffBu7KIGrE" },
    { id: "s7", alt: "Old paper texture", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDyuqCFVrIU_6mBbRpz6OqJvcgLs1ey051CjHdKBND-LaW7OtaqDn-i4f3CrZAvhcc2tOyfXHwI9fW_FT4SC0nt-XvZ-PeCTjzy2jBLdbu1n6QufuKozQl1NXIy1twyt4YIMvd5XgGPKaMk-8WHz2MORUid1uf_cNzFEA1eqCNCImmjLA0FOWPQu55IlkdZ-UL2bEkCCQ526pA4BRCBGBA19qiDx0w2AQKoR2TZqj59jFifrldczfJtsFQxHsCOJSON12H6vd6O8Nkj" },
    { id: "s8", alt: "Vintage butterfly", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9GCnrEa6iDvuIb0juYZmyZztThxgR7dDNBdmN3--w-Sdb1OPWor6DpuGvKWA4mv-vYSSJyvLxVBKduQFmwyNkUhtgyShYaffpbRygLBouL-SUnMntc8g3ZlvXSkFRRiqcC_5uPwX6ibPMzhBZLGRFxAV-DXq2bWfqBv2qqn73JFJl2m83ENNDqJTQVGEa1ajen_s_0-zRVJr87sNxm0t7klc4ah3LSlL19XJ83UUTQSeeUXaQpQY017Ka4cxuwIxysCqDQB38J5lB" },
    { id: "s9", alt: "Vintage friends photo", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWKS_9kngxk_NSQvitP_E6zmrmGe0o4L4hU86rRBcr0wiqNBjot0JdD6hrgCm1dqlTaPJv7IZa-QvPEdM5HvuOU9zeYzQLxn7kU4u0slk3UY0IJX8Ke1C_dO6kk--LpyvkEFHdFQiLcJXKW9DyoKhHVVUI7aAUx79fvX71zITnuDifS7VSeOs309PEr2W070lFL4kR4LHch1ncV36QPrQxbxquqrv9dFfG1oHXZvk8VuR9IaIYhAardixFDnzwzuisoLEuxeAFUlcp" },
    { id: "s10", alt: "Antique airmail envelope", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZG8MDxnaJEMqzynlnXDRLzLvQWlM-YDBEKU6cHa1Nfijv2pPWDmNWT9WtmMIzs4y4P2sNs5zbtAKJm3carpEpW_Hmt2oEDMPgHdXoW8K9SB5sp9LHB4jwcriGlkP3Da2kS0j5hwmsBT4qEiJB2k6kxXf4exNN1nB7DEbhJEZJ-0DwawqSWD0sjjjRNCfJK5CktkhiqNr1UjnXvf2p-DqbCqepUVJBAdIRbHXf3tDRCVs8sGRsmd7JQA_tVrHVjQXZ4MFqK_DnEQIa" },
    { id: "s11", alt: "Torn kraft paper", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB9AdLRde-OnyJ7dKFgF4WNsaoD_LPCN_n7XGtO769zzhett3r88sW_WillD9u-KxSDTPwmitzs5zl_L-NSkimDQPOkEqvzhSGOVxMpU-PeTThflkBZ2hkecUwgXiCVttaSfXm92wuvRt_fYt19bEqbvQ2zYY9ep7B0Gj6cC1B8JFdpsDsYW5SbOVVgrRD70lYKVcwGS78r8_EQ3yEY0znkEBEOa9JH2-UcZCwfQoJJsArSCD77xUfGOrf_VRTlLHTFTqaupUrFM7JN" },
    { id: "s12", alt: "Pressed blue flowers", url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuUbJGVyKu2ERwWnZ8g6OWrqrziitycyX0WLLc9Uc9GV-coYUAlx19w8Pyl7U6yqZR68GkuF8-zVsrZvInhlVLniDO3KrdRwJdi3PaiGPi8DZeouN6vSyJUn-dl8_oB_mEVMm59-6UEhrR0xjxSpwj-nWf5bfYgvfLT5SvM8DqKtb4b2S89m9TJafS2QflENpl7dQxogyEZmFaqLp8dd0KvWGYvg0TLmO_eCQq7r2Iv6wmuGEEq9iclmVcDM5tsmx3zLxX4K2LqKTe" }
];

export default function StickerTray({ isOpen, onClose, onSelectSticker }: StickerTrayProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute right-8 top-24 bottom-24 w-80 bg-paper/95 backdrop-blur-md rounded-2xl shadow-xl shadow-black/10 border border-black/5 flex flex-col z-50 overflow-hidden animate-in slide-in-from-right-8 duration-300">
            <header className="flex items-center justify-between px-5 py-4 border-b border-black/5 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-sage">local_florist</span>
                    <h3 className="font-bold text-ink">Éphémères</h3>
                </div>
                <button
                    onClick={onClose}
                    className="size-8 flex items-center justify-center rounded-full hover:bg-black/5 text-ink-light transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                    {STICKERS.map((sticker) => (
                        <button
                            key={sticker.id}
                            onClick={() => {
                                onSelectSticker(sticker.url);
                                onClose();
                            }}
                            className="aspect-square relative rounded-xl border border-black/5 bg-white shadow-soft hover:shadow-md hover:scale-105 transition-all overflow-hidden group"
                        >
                            <img
                                src={sticker.url}
                                alt={sticker.alt}
                                className="w-full h-full object-contain p-2"
                                crossOrigin="anonymous"
                            />
                            <div className="absolute inset-0 bg-sage/0 group-hover:bg-sage/5 transition-colors" />
                        </button>
                    ))}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(0,0,0,0.1);
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}
