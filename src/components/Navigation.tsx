"use client";

import Link from 'next/link';
import { Download, ListMusic, Tv, Rss } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  // Hide navigation on public share pages
  if (pathname?.startsWith('/v/')) {
    return null;
  }

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'center',
      padding: '1.5rem',
      zIndex: 100,
      pointerEvents: 'none'
    }}>
      <div className="glass-panel" style={{
        display: 'flex',
        gap: '2rem',
        padding: '0.8rem 2rem',
        borderRadius: '100px',
        pointerEvents: 'auto'
      }}>
        <Link href="/" className="nav-link">
          <Download size={20} />
          <span>Download</span>
        </Link>
        <Link href="/queue" className="nav-link">
          <ListMusic size={20} />
          <span>Queue</span>
        </Link>
        <Link href="/library" className="nav-link">
          <Tv size={20} />
          <span>Library</span>
        </Link>
        <Link href="/subscriptions" className="nav-link">
          <Rss size={20} />
          <span>Subscriptions</span>
        </Link>
      </div>
    </nav>
  );
}
