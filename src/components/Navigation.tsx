"use client";

import Link from 'next/link';
import { Download, ListMusic, Tv, Rss, Settings, LogOut, Shield, Menu, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navigation({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Hide navigation on public share pages
  if (pathname?.startsWith('/v/')) return null;

  const isActive = (href: string) => pathname === href;

  const navLinks = [
    { href: '/', icon: <Download size={17} />, label: 'Download' },
    { href: '/queue', icon: <ListMusic size={17} />, label: 'Queue' },
    { href: '/library', icon: <Tv size={17} />, label: 'Library' },
    { href: '/subscriptions', icon: <Rss size={17} />, label: 'Subscriptions' },
    ...(isAdmin ? [
      { href: '/settings', icon: <Settings size={17} />, label: 'Settings' },
      { href: '/admin', icon: <Shield size={17} />, label: 'Admin' },
    ] : []),
  ];

  return (
    <>
      <style>{`
        .site-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: 60px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          transition: background 0.3s, box-shadow 0.3s, border-color 0.3s;
          background: var(--background, #fff);
          border-bottom: 1px solid transparent;
        }
        .site-header.scrolled {
          background: var(--card-bg, rgba(255,255,255,0.92));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom-color: var(--border);
          box-shadow: 0 1px 12px rgba(0,0,0,0.06);
        }
        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ── Logo ── */
        .header-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .logo-text {
          font-size: 1.35rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--foreground);
          line-height: 1;
        }
        .logo-text span {
          color: var(--primary, #1a85ff);
        }

        /* ── Desktop nav ── */
        .header-nav {
          display: flex;
          align-items: center;
          gap: 0.15rem;
        }
        .h-nav-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          border-radius: 8px;
          color: var(--text-muted, #888);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.875rem;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          background: transparent;
          border: none;
          cursor: pointer;
        }
        .h-nav-item:hover {
          background: var(--hover);
          color: var(--foreground);
        }
        .h-nav-item.active {
          background: rgba(var(--primary-rgb, 26,133,255), 0.1);
          color: var(--primary, #1a85ff);
          font-weight: 600;
        }
        .h-nav-item.logout {
          color: #ef4444;
        }
        .h-nav-item.logout:hover {
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
        }

        /* ── Mobile burger ── */
        .mobile-burger {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px; height: 38px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--foreground);
          cursor: pointer;
          transition: background 0.15s;
        }
        .mobile-burger:hover { background: var(--hover); }

        /* ── Mobile drawer ── */
        .mobile-drawer {
          display: none;
          position: fixed;
          top: 60px; left: 0; right: 0;
          background: var(--card-bg, white);
          border-bottom: 1px solid var(--border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 0.75rem 1rem;
          flex-direction: column;
          gap: 0.25rem;
          z-index: 99;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .mobile-drawer.open { display: flex; }
        .mobile-drawer .h-nav-item {
          padding: 0.7rem 1rem;
          border-radius: 10px;
          font-size: 0.95rem;
        }

        @media (max-width: 768px) {
          .header-nav { display: none; }
          .mobile-burger { display: flex; }
        }
      `}</style>

      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <div className="header-inner">
          {/* Logo */}
          <Link 
            href="/" 
            className="header-logo"
            onClick={(e) => {
              if (pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <img src="/logo.png" alt="Logo" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }} />
            <span className="logo-text">Media<span>Load</span></span>
          </Link>

          {/* Desktop nav */}
          <nav className="header-nav">
            {navLinks.map(({ href, icon, label }) => (
              <Link key={href} href={href} className={`h-nav-item${isActive(href) ? ' active' : ''}`}>
                {icon}
                {label}
              </Link>
            ))}
            {isAdmin && (
              <button onClick={handleLogout} className="h-nav-item logout">
                <LogOut size={17} />
                Logout
              </button>
            )}
          </nav>

          {/* Mobile burger */}
          <button className="mobile-burger" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`mobile-drawer${mobileOpen ? ' open' : ''}`}>
        {navLinks.map(({ href, icon, label }) => (
          <Link key={href} href={href} className={`h-nav-item${isActive(href) ? ' active' : ''}`}>
            {icon}
            {label}
          </Link>
        ))}
        {isAdmin && (
          <button onClick={handleLogout} className="h-nav-item logout">
            <LogOut size={17} />
            Logout
          </button>
        )}
      </div>
    </>
  );
}
