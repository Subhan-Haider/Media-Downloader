import { readDB } from '@/lib/db';
import { notFound } from 'next/navigation';
import { Download, Music, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const db = readDB();
  const item = db.library.find(i => i.id === params.id);
  
  if (!item) return { title: 'Media Not Found' };
  
  return {
    title: item.title + ' | Media Downloader',
    description: 'Shared via Media Downloader',
    openGraph: {
      images: item.thumbnail ? [item.thumbnail] : [],
    }
  };
}

export default async function SharedMediaPage({ params }: { params: { id: string } }) {
  const db = readDB();
  const item = db.library.find(i => i.id === params.id);
  
  if (!item || !item.filename) {
    notFound();
  }
  
  const ext = item.filename.toLowerCase();
  const isImageFile = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].some(e => ext.endsWith(e));
  const isAudioFile = ['.mp3', '.m4a'].some(e => ext.endsWith(e));
  const isVideoFile = ['.mp4', '.webm', '.mkv', '.mov'].some(e => ext.endsWith(e));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      {/* Simple Header */}
      <header style={{ padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/watermark.png" alt="Logo" style={{ width: '32px', height: 'auto', filter: 'brightness(100)' }} />
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Media Downloader</span>
        </div>
        <a 
          href={`/api/media/${item.id}?download=true`} 
          download 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '9999px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'filter 0.2s' }}
        >
          <Download size={16} />
          Download
        </a>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '1000px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          
          {/* Media Player Area */}
          <div style={{ width: '100%', background: '#000', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {isImageFile && (
              <img src={`/api/media/${item.id}`} alt={item.title} style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
            )}
            
            {isVideoFile && (
              <video 
                src={`/api/media/${item.id}`} 
                poster={item.thumbnail} 
                controls 
                autoPlay 
                style={{ width: '100%', maxHeight: '75vh' }} 
              />
            )}
            
            {isAudioFile && (
              <div style={{ padding: '4rem 2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,1) 100%)' }}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="Cover" style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }} />
                ) : (
                  <div style={{ width: '150px', height: '150px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
                    <Music size={64} color="white" />
                  </div>
                )}
                <audio src={`/api/media/${item.id}`} controls autoPlay style={{ width: '100%', maxWidth: '600px', height: '54px', borderRadius: '8px' }} />
              </div>
            )}
          </div>
          
          {/* Media Info Footer */}
          <div style={{ padding: '1.5rem 2rem', background: 'rgba(255,255,255,0.02)' }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 }}>{item.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><ShieldCheck size={16} /> Securely Shared</span>
              <span>•</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ext.split('.').pop()} FILE</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
