import type { Metadata } from "next";
import "./globals.css";

const DEFAULT_SITE_URL =
  "https://jvvtr.github.io/royalpath-tibia-rp/";
const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
const siteUrl = new URL(
  configuredSiteUrl.endsWith("/")
    ? configuredSiteUrl
    : `${configuredSiteUrl}/`,
);
const faviconUrl = new URL("favicon.png", siteUrl);
const socialImageUrl = new URL("og.png", siteUrl);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "RoyalPath — Guia Royal Paladin",
    template: "%s · RoyalPath",
  },
  description:
    "Guia simples e gratuito para iniciantes de Royal Paladin: vida, mana, equipamentos, defesa, dano estimado e onde caçar.",
  applicationName: "RoyalPath",
  keywords: [
    "Tibia",
    "Royal Paladin",
    "guia",
    "hunts",
    "progressão",
    "simulador de dano",
  ],
  authors: [{ name: "RoyalPath · projeto 100% criado com IA" }],
  icons: {
    icon: faviconUrl,
    shortcut: faviconUrl,
    apple: faviconUrl,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "RoyalPath",
    title: "RoyalPath — Guia Royal Paladin",
    description:
      "Entenda seu Royal Paladin sem complicação: monte o set e veja vida, mana, defesa e DPS esperado.",
    images: [
      {
        url: socialImageUrl,
        width: 1672,
        height: 941,
        alt: "RoyalPath — Guia Royal Paladin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RoyalPath — Guia Royal Paladin",
    description:
      "Guia simples para iniciantes: arsenal visual, progressão e simulador de Royal Paladin.",
    images: [socialImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
