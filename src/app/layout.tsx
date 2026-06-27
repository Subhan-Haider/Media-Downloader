import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Download, ListMusic, Tv, Rss } from 'lucide-react';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Media Server",
  description: "Universal Media Downloader and Server",
  icons: {
    icon: "/logo.png",
  },
};

import MainLayout from '@/components/MainLayout';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const isAdmin = !!session;

  return (
    <html lang="en">
      <body className={inter.className}>
        <MainLayout isAdmin={isAdmin}>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
