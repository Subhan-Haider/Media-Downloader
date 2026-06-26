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
        .nav-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          padding: 1rem 1rem;
          z-index: 100;
          pointer-events: none;
          box-sizing: border-box;
          max-width: 100vw;
          overflow: hidden;
        }
        .nav-pill {
          display: flex;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border-radius: 100px;
          pointer-events: auto;
          flex-wrap: nowrap;
          max-width: calc(100vw - 2rem);
          overflow: hidden;
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
          flex-shrink: 0;
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

        /* Tablet — slightly smaller text */
        @media (max-width: 640px) {
          .nav-item {
            padding: 0.5rem 0.85rem;
            font-size: 0.85rem;
            gap: 0.35rem;
          }
          .nav-pill {
            padding: 0.4rem 0.6rem;
          }
        }

        /* Mobile — icons only, no labels */
        @media (max-width: 430px) {
          .nav-label {
            display: none;
          }
          .nav-item {
            padding: 0.6rem 0.75rem;
          }
          .nav-pill {
            gap: 0.1rem;
            padding: 0.4rem 0.5rem;
          }
        }
      `}</style>
      <nav className="nav-wrapper">
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
