'use client';

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
        Privacy Policy & Terms of Service
      </h1>

      <div className="glass-panel" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', lineHeight: '1.6' }}>
        
        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#ef4444' }}>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Educational Purpose Disclaimer
          </h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            This application is created strictly for <strong>educational purposes only</strong>. The developers do not endorse, encourage, or support the downloading of copyrighted material. You are solely responsible for ensuring you have the legal right or explicit permission to download, store, and consume any media using this tool.
          </p>
        </div>

        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>1. Privacy & Data Collection</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            This Media Server application runs locally on your own machine. We do not track, collect, or transmit any of your personal data, downloaded files, or search history to any external servers or third-party tracking services. All processing is done strictly on your local device.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>2. Local Storage</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            All media files downloaded through this application are stored physically on your local hard drive in the designated `data/library` folder. You have complete ownership and control over these files. If you delete a file through the application interface, it is permanently deleted from your local storage.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>3. Fair Use & Copyright</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            This software is provided as a personal utility to archive and backup media for offline, personal consumption. You are solely responsible for ensuring that your use of this application complies with the copyright laws of your jurisdiction and the Terms of Service of the platforms you are downloading from.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>4. No Warranty</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            This software is provided "as is", without warranty of any kind, express or implied. In no event shall the developers be liable for any claim, damages, or other liability arising from, out of, or in connection with the software or the use of the software.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>5. Contact Information</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            If you have any questions, you can reach out via email at <a href="mailto:support@subhan.tech" style={{ color: 'var(--primary)' }}>support@subhan.tech</a>.
          </p>
        </section>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
          <a 
            href="/"
            style={{
              padding: '0.8rem 2rem', background: 'var(--primary)', color: 'white', textDecoration: 'none',
              borderRadius: '8px', fontWeight: 600, transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}
