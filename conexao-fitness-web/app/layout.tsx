import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/layout/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Conexão Fitness | A sua plataforma de bem-estar",
  description: "Agende seus horários e serviços na melhor plataforma de saúde.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-dark text-slate-50 selection:bg-brand-green/20 selection:text-brand-green">
        <Navbar />
        {/* Adiciona um padding-top para compensar a Navbar fixa (h-20 = 5rem / 80px) */}
        <main className="flex-1 pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
