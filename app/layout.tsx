import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.includes("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https");
  const base = new URL(`${protocol}://${host}`);

  return {
    metadataBase: base,
    title: {
      default: "RoyalPath — Guia Royal Paladin",
      template: "%s · RoyalPath",
    },
    description:
      "Guia pessoal e gratuito de progressão, hunts, equipamentos e dano estimado para Royal Paladin no Tibia.",
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
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: base,
      siteName: "RoyalPath",
      title: "RoyalPath — Guia Royal Paladin",
      description:
        "Sua rota de progressão do level 8 ao endgame, revisada para julho de 2026.",
      images: [
        {
          url: new URL("/og.png", base),
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
        "Progressão, hunts, arsenal e simulador comparativo para Royal Paladin.",
      images: [new URL("/og.png", base)],
    },
  };
}

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
