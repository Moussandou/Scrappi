import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Caveat,
  Work_Sans,
  Playfair_Display,
  Dancing_Script,
  Indie_Flower,
  Pacifico,
  Satisfy
} from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/infra/auth/authContext";
import { MaintenanceGuard } from "@/ui/components/MaintenanceGuard";
import { AppInitializer } from "@/ui/components/AppInitializer";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
});

const indie = Indie_Flower({
  variable: "--font-indie",
  weight: "400",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  variable: "--font-pacifico",
  weight: "400",
  subsets: ["latin"],
});

const satisfy = Satisfy({
  variable: "--font-satisfy",
  weight: "400",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scrappi - Votre Carnet Créatif Infini",
  description: "Créez, organisez et partagez vos scrapbooks numériques. Un espace infini pour votre créativité, vos souvenirs et vos inspirations.",
  keywords: ["scrapbook", "créativité", "numérique", "journaling", "design", "canvas"],
  authors: [{ name: "Scrappi Team" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://scrappi.app",
    siteName: "Scrappi",
    title: "Scrappi - Votre Carnet Créatif Infini",
    description: "Créez, organisez et partagez vos scrapbooks numériques. Un espace infini pour votre créativité.",
    images: [
      {
        url: "/favicon.svg",
        width: 1200,
        height: 630,
        alt: "Scrappi Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrappi - Votre Carnet Créatif Infini",
    description: "Créez, organisez et partagez vos scrapbooks numériques.",
    images: ["/favicon.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
      </head>
      <body
        className={`${jakarta.variable} ${caveat.variable} ${dancing.variable} ${indie.variable} ${pacifico.variable} ${satisfy.variable} ${workSans.variable} ${playfair.variable} antialiased`}
      >
        <AuthProvider>
          <AppInitializer>
            <MaintenanceGuard>
              {children}
            </MaintenanceGuard>
          </AppInitializer>
        </AuthProvider>
      </body>
    </html>
  );
}
