import { readDB } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Download, Music, ShieldCheck } from 'lucide-react';
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: 'white', fontFamily: 'system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      {/* Blurred Background */}
      {item.thumbnail && (
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%',
          backgroundImage: `url('${item.thumbnail}')`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(60px) brightness(0.3)', zIndex: 0, opacity: 0.8
        }} />
      )}

      {/* Simple Header */}
      <header style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%)', position: 'relative', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/watermark.png" alt="Logo" style={{ width: '32px', height: 'auto', filter: 'brightness(100)' }} />
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Media Downloader</span>
        </div>
        <a 
          href={`/api/media/${item.id}?download=true`} 
          download 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '9999px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none'; }}
        >
          <Download size={16} />
          Save File
        </a>
      </header>

      {/* Main Content (Immersive) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 10, height: 'calc(100vh - 76px)' }}>
        
        {/* Media Player Area */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', position: 'relative' }}>
          {isImageFile && (
            <img src={`/api/media/${item.id}`} alt={item.title} style={{ width: '100%', height: '100%', maxHeight: 'calc(100vh - 180px)', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }} />
          )}
          
          {isVideoFile && (
            <video 
              src={`/api/media/${item.id}`} 
              poster={item.thumbnail} 
              controls 
              autoPlay 
              style={{ width: '100%', height: '100%', maxHeight: 'calc(100vh - 180px)', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))' }} 
            />
          )}
          
          {isAudioFile && (
            <div style={{ padding: '4rem 2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="Cover" style={{ width: '300px', height: '300px', objectFit: 'cover', borderRadius: '24px', boxShadow: '0 30px 60px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)' }} />
              ) : (
                <div style={{ width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Music size={80} color="rgba(255,255,255,0.8)" />
                </div>
              )}
              <audio src={`/api/media/${item.id}`} controls autoPlay style={{ width: '100%', maxWidth: '600px', height: '54px', borderRadius: '8px', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }} />
            </div>
          )}
        </div>
        
        {/* Media Info Footer */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', marginTop: 'auto' }}>
          <h1 style={{ margin: '0 0 0.75rem 0', fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3, maxWidth: '800px', textShadow: '0 4px 15px rgba(0,0,0,0.6)' }}>{item.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', borderRadius: '9999px', backdropFilter: 'blur(10px)' }}><ShieldCheck size={16} /> Securely Shared</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.8rem', borderRadius: '9999px', backdropFilter: 'blur(10px)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ext.split('.').pop()} FILE</span>
          </div>
        </div>

      </main>
    </div>
  );
}
