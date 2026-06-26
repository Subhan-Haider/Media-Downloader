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

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <style>{`
        .nav-pill {
          display: flex;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          border-radius: 100px;
          pointer-events: auto;
          flex-wrap: nowrap;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 100px;
          color: var(--foreground);
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
          background: transparent;
          white-space: nowrap;
          font-size: 0.95rem;
        }
        .nav-item:hover {
          background: var(--hover);
          color: var(--primary);
        }
        .nav-item.active {
          background: var(--primary);
          color: white;
        }
        .nav-label {
          display: inline;
        }
        @media (max-width: 500px) {
          .nav-label {
            display: none;
          }
          .nav-item {
            padding: 0.6rem 0.8rem;
          }
          .nav-pill {
            gap: 0.25rem;
            padding: 0.5rem 0.75rem;
          }
        }
      `}</style>
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '1.25rem 1rem',
        zIndex: 100,
        pointerEvents: 'none'
      }}>
        <div className="glass-panel nav-pill">
          <Link href="/" className={`nav-item${isActive('/') ? ' active' : ''}`}>
            <Download size={20} />
            <span className="nav-label">Download</span>
          </Link>
          <Link href="/queue" className={`nav-item${isActive('/queue') ? ' active' : ''}`}>
            <ListMusic size={20} />
            <span className="nav-label">Queue</span>
          </Link>
          <Link href="/library" className={`nav-item${isActive('/library') ? ' active' : ''}`}>
            <Tv size={20} />
            <span className="nav-label">Library</span>
          </Link>
          <Link href="/subscriptions" className={`nav-item${isActive('/subscriptions') ? ' active' : ''}`}>
            <Rss size={20} />
            <span className="nav-label">Subscriptions</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
