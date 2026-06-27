import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Download, ListMusic, Tv, Rss } from 'lucide-react';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ["latin"] });

import { readDB } from '@/lib/db';

export async function generateMetadata(): Promise<Metadata> {
  const db = readDB();
  return {
    title: db.settings?.siteTitle || "Media Server",
    description: db.settings?.siteDescription || "Universal Media Downloader and Server",
    icons: {
      icon: "/logo.png",
    }
  }
}

import MainLayout from '@/components/MainLayout';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const isAdmin = !!session;
  
  const db = readDB();
  const themeColor = db.settings?.themeColor || '#0070f3';
  const announcement = db.settings?.announcementText;

  return (
    <html lang="en">
      <body className={inter.className}>
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --primary: ${themeColor};
            --primary-hover: ${themeColor}dd;
            --primary-rgb: ${parseInt(themeColor.slice(1,3), 16)}, ${parseInt(themeColor.slice(3,5), 16)}, ${parseInt(themeColor.slice(5,7), 16)};
          }
        `}} />
        {announcement && (
          <div style={{ background: 'var(--primary)', color: 'white', textAlign: 'center', padding: '0.75rem', fontWeight: 600, zIndex: 1000, position: 'relative' }}>
            {announcement}
          </div>
        )}
        <MainLayout isAdmin={isAdmin}>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
