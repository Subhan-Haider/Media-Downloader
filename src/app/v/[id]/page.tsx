import { readDB } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Download, Music, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const db = readDB();
  const item = db.library.find(i => i.id === resolvedParams.id);
  
  if (!item) return { title: 'Media Not Found' };
  
  return {
    title: item.title + ' | Media Downloader',
    description: 'Shared via Media Downloader',
    openGraph: {
      images: item.thumbnail ? [item.thumbnail] : [],
    }
  };
}

export default async function SharedMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const db = readDB();
  const item = db.library.find(i => i.id === resolvedParams.id);
  
  if (!item || !item.filename) {
    notFound();
  }
  
  const ext = item.filename.toLowerCase();
  const isImageFile = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].some(e => ext.endsWith(e));
  const isAudioFile = ['.mp3', '.m4a'].some(e => ext.endsWith(e));
  const isVideoFile = ['.mp4', '.webm', '.mkv', '.mov'].some(e => ext.endsWith(e));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background)', color: 'var(--foreground)', fontFamily: 'inherit' }}>
      
      {/* Clean Transparent Header */}
      <header style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/brand-logo.png" alt="Logo" style={{ width: '70px', height: 'auto', dropShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
          <span style={{ 
            fontWeight: 900, 
            fontSize: '2rem', 
            letterSpacing: '-0.03em', 
            background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 50%, #db2777 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            Media Downloader
          </span>
        </div>
        <Link 
          href="/library" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--foreground)', textDecoration: 'none', fontWeight: 600, fontSize: '1.1rem', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
        >
          <ArrowLeft size={20} />
          Back to Library
        </Link>
      </header>

      {/* Main Content (Clean Theme-Matched Layout) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem 4rem 2rem' }}>
        
        <div style={{ 
          width: '100%', 
          maxWidth: '1200px', 
          background: 'var(--card-bg)', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          border: '1px solid var(--border)', 
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)'
        }}>
          
          {/* Media Player Area */}
          <div style={{ width: '100%', background: 'rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {isImageFile && (
              <img src={`/api/media/${item.id}`} alt={item.title} style={{ display: 'block', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            )}
            
            {isVideoFile && (
              <video 
                src={`/api/media/${item.id}`} 
                poster={item.thumbnail} 
                controls 
                autoPlay 
                style={{ display: 'block', width: '100%', maxHeight: '70vh' }} 
              />
            )}
            
            {isAudioFile && (
              <div style={{ padding: '5rem 2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3rem' }}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="Cover" style={{ width: '350px', height: '350px', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.15)' }} />
                ) : (
                  <div style={{ width: '200px', height: '200px', background: 'var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={64} color="var(--text-muted)" />
                  </div>
                )}
                <audio src={`/api/media/${item.id}`} controls autoPlay style={{ width: '100%', maxWidth: '800px', height: '54px', transform: 'scale(1.25)', transformOrigin: 'center', marginTop: '1.5rem' }} />
              </div>
            )}
          </div>
          
          {/* Media Info Footer Panel */}
          <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--foreground)' }}>
                {item.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--hover)', padding: '0.3rem 0.8rem', borderRadius: '8px' }}><ShieldCheck size={16} /> Securely Shared</span>
                <span style={{ background: 'var(--hover)', padding: '0.3rem 0.8rem', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ext.split('.').pop()} FILE</span>
              </div>
            </div>

            <a 
              href={`/api/media/${item.id}?download=true`} 
              download 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', transition: 'background 0.2s', boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.3)', flexShrink: 0, marginLeft: '1.5rem' }}
            >
              <Download size={18} />
              Save File
            </a>
            
          </div>
        </div>
      </main>
    </div>
  );
}
