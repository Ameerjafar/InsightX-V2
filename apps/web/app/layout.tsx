import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "InsightX",
  description: "Trade dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold">InsightX</Link>
            <nav className="flex gap-4 text-slate-300">
              <Link className="hover:text-white" href="/dashboard">Dashboard</Link>
              <Link className="hover:text-white" href="/trade">Trade</Link>
              <Link className="hover:text-white" href="/auth">Auth</Link>
            </nav>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 flex">
          <Sidebar />
          <main className="flex-1 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
