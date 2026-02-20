import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SCRAPPI - Creative Canvas",
  description: "Create an infinite visual scrapbook",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${jakarta.variable} ${caveat.variable} antialiased bg-bg-dark text-text-cream min-h-screen relative overflow-hidden felt-texture`}
      >
        <div className="fixed inset-0 pointer-events-none opacity-30 z-0 bg-noise mix-blend-overlay"></div>
        {children}
      </body>
    </html>
  );
}
