import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Download, ListMusic, Tv, Rss } from 'lucide-react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Media Server",
  description: "Universal Media Downloader and Server",
  icons: {
    icon: "/logo.png",
  },
};

import MainLayout from '@/components/MainLayout';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MainLayout>
          {children}
            <a href="https://www.tiktok.com/@s.subhan.haider" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="footer-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
          </div>

          <div style={{ marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem auto', padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '16px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.7 }}>Our Network</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem 1.5rem' }}>
              {[
                { name: 'AdShield VPN', url: 'https://adshield-vpn.subhan.tech' },
                { name: 'Security', url: 'https://security.subhan.tech' },
                { name: 'Subhan Tech', url: 'https://subhan.tech' },
                { name: 'Emoji', url: 'https://emoji.subhan.tech' },
                { name: 'Lootops', url: 'https://lootops.me' },
                { name: 'Lootops App', url: 'https://app.lootops.me' },
                { name: 'Lootops Web', url: 'https://lootops.website' },
                { name: 'CodeLens', url: 'https://codelens.site' },
                { name: 'BlizFlow', url: 'https://blizflow.online' },
                { name: 'Codiner', url: 'https://codiner.online' }
              ].map(site => (
                <a key={site.url} href={site.url} target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.85rem' }}>
                  {site.name}
                </a>
              ))}
            </div>
          </div>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <p style={{ margin: '0 0 1.5rem 0', opacity: 0.8, lineHeight: '1.6', fontSize: '0.85rem' }}>
              <strong style={{ color: '#ef4444' }}>Disclaimer:</strong> This application is created strictly for <strong>educational purposes only</strong>. 
              The developers do not endorse, encourage, or support the downloading of copyrighted material. 
              You are solely responsible for ensuring you have the legal right or permission to download and store any media using this tool.
            </p>
            <p style={{ margin: 0, opacity: 0.6, fontSize: '0.85rem' }}>
              &copy; {new Date().getFullYear()} Media Server. All processing is done locally on your machine.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
