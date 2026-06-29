"use client";

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import Link from 'next/link';

export default function MainLayout({ children, isAdmin }: { children: React.ReactNode, isAdmin?: boolean }) {
  const pathname = usePathname();

  // If this is a public share page, render without the global app shell (no nav, no padding, no footer)
  if (pathname?.startsWith('/v/')) {
    return <main>{children}</main>;
  }

  // Otherwise, render the standard app shell
  return (
    <>
      <Navigation isAdmin={isAdmin} />
      
      <main style={{ paddingTop: '60px', minHeight: 'calc(100vh - 80px)', paddingBottom: '40px' }}>
        {children}
      </main>
      
      <footer style={{ 
        textAlign: 'center', 
        padding: '2rem 1.5rem', 
        color: 'var(--text-muted)', 
        fontSize: '0.9rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--card-bg)',
        backdropFilter: 'blur(10px)',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/" className="footer-link">Home</Link>
          <Link href="/about" className="footer-link">About</Link>
          <Link href="/library" className="footer-link">Library</Link>
          <Link href="/blog" className="footer-link">Blog</Link>
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
          <Link href="/terms" className="footer-link">Terms of Service</Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <a href="https://github.com/subhan-haider" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="footer-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/><path d="M9 18c-4.5 1.5-5-2.5-7-3"/></svg>
          </a>
          <a href="https://www.instagram.com/subhan_haid" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="https://www.tiktok.com/@s.subhan.haider" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="footer-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
          </a>
          <a href="mailto:contact@subhan-haider.dev" aria-label="Email" className="footer-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
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
    </>
  );
}
