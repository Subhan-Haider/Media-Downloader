import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh', padding: '0 1rem' }}>
      
      {/* Background Decorator */}
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, rgba(236,72,153,0) 70%)', filter: 'blur(60px)', zIndex: -1, pointerEvents: 'none' }} />

      <div style={{ textAlign: 'center', marginBottom: '4rem', marginTop: '4rem', position: 'relative' }}>
        <div style={{ display: 'inline-block', padding: '0.4rem 1.2rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '100px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.5rem', backdropFilter: 'blur(10px)' }}>
          OUR STORY
        </div>
        <h1 style={{ fontSize: '4.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1, textShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          About <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: '0 0 40px rgba(79, 70, 229, 0.2)' }}>Media Server</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', marginTop: '1.5rem', opacity: 0.9, maxWidth: '700px', margin: '1.5rem auto 0 auto', lineHeight: 1.6 }}>
          Building a desktop-class media processing suite that respects your privacy, your bandwidth, and your time.
        </p>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', padding: '4rem', borderRadius: '32px', display: 'flex', flexDirection: 'column', gap: '3rem', position: 'relative' }}>
        
        <section>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>The Philosophy</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.7, margin: 0 }}>
            Media Server was created by <strong>Subhan Haider</strong>, Founder and Lead Developer, with the goal of delivering a desktop-class media downloading suite that operates entirely locally — eliminating the need for cloud uploads, server queues, or subscription accounts. The project was born out of frustration with existing online tools that rely on intrusive ads, fake download buttons, and unnecessary privacy risks.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Four Core Pillars</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            
            <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>100% Local Operations</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                All processing executes in your browser and your local device. We fetch the raw media streams directly, meaning zero tracking logs and complete privacy for your downloads.
              </p>
            </div>

            <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(219, 39, 119, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Maximum Bandwidth</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                By avoiding middle-man proxy servers, Media Server leverages your full connection speed to fetch files at near-native speeds. No waiting rooms, no speed caps.
              </p>
            </div>

            <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Secure & Private</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                Zero file caching, tracking data, or remote server disk logging. Your history belongs to you, and we don't hold your files hostage.
              </p>
            </div>

            <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>4</div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Premium Aesthetic</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
                Studio-grade glassmorphism design with harmonic color scales, premium animations, and a modern interface that respects your time.
              </p>
            </div>

          </div>
        </section>

        <section style={{ padding: '2rem', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '24px', border: '1px dashed rgba(79, 70, 229, 0.2)' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--foreground)' }}>About the Creator</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.7, margin: '0 0 1.5rem 0' }}>
            Subhan Haider is a developer passionate about building advanced local-first web applications, privacy-focused tools, and highly aesthetic digital workspaces. 
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="https://github.com/subhan-haider" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.8rem 1.5rem', background: 'var(--foreground)', color: 'var(--background)', textDecoration: 'none', borderRadius: '100px', fontWeight: 600, fontSize: '0.95rem' }}>
              GitHub Profile
            </a>
            <a href="https://subhan.tech" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.8rem 1.5rem', background: 'rgba(0,0,0,0.05)', color: 'var(--foreground)', textDecoration: 'none', borderRadius: '100px', fontWeight: 600, fontSize: '0.95rem', border: '1px solid rgba(0,0,0,0.1)' }}>
              subhan.tech
            </a>
            <a href="https://www.instagram.com/subhan_haid" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '0.8rem 1.5rem', background: 'rgba(0,0,0,0.05)', color: 'var(--foreground)', textDecoration: 'none', borderRadius: '100px', fontWeight: 600, fontSize: '0.95rem', border: '1px solid rgba(0,0,0,0.1)' }}>
              Instagram
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
