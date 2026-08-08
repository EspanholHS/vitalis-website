import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Sora } from "next/font/google";
import type { Viewport } from "next";
import "./globals.css";

const sora = Sora({
  variable: "--vitalis-logo-font",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--vitalis-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Vitalis | Organização Inteligente de Medicamentos",
  description:
    "Landing page da Vitalis para pacientes, cuidadores e familiares organizarem medicamentos com simplicidade e segurança.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${sora.variable} ${inter.variable} ${cormorant.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
