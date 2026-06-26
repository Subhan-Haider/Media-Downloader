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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--background, #f8fafc)', color: 'var(--foreground, #0f172a)', fontFamily: 'inherit' }}>
      
      {/* Clean Transparent Header */}
      <header style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/watermark.png" alt="Logo" style={{ width: '32px', height: 'auto', opacity: 0.9 }} />
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Media Downloader</span>
        </div>
      </header>

      {/* Main Content (Horizontal Layout) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 2rem 4rem 2rem' }}>
        
        <div style={{ 
          width: '100%', 
          maxWidth: '1200px', 
          background: 'var(--card-bg, rgba(255, 255, 255, 0.7))', 
          borderRadius: '24px', 
          overflow: 'hidden', 
          border: '1px solid var(--border, rgba(0, 0, 0, 0.1))', 
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexWrap: 'wrap',
          minHeight: '65vh',
          backdropFilter: 'blur(10px)'
        }}>
          
          {/* Media Player Area */}
          <div style={{ flex: '2 1 600px', background: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {isImageFile && (
              <img src={`/api/media/${item.id}`} alt={item.title} style={{ display: 'block', maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
            )}
            
            {isVideoFile && (
              <video 
                src={`/api/media/${item.id}`} 
                poster={item.thumbnail} 
                controls 
                autoPlay 
                style={{ display: 'block', width: '100%', maxHeight: '75vh' }} 
              />
            )}
            
            {isAudioFile && (
              <div style={{ padding: '4rem 2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="Cover" style={{ width: '250px', height: '250px', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1)' }} />
                ) : (
                  <div style={{ width: '150px', height: '150px', background: 'var(--border, rgba(0, 0, 0, 0.1))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={48} color="var(--text-muted, #64748b)" />
                  </div>
                )}
                <audio src={`/api/media/${item.id}`} controls autoPlay style={{ width: '100%', maxWidth: '400px', height: '44px' }} />
              </div>
            )}
          </div>
          
          {/* Media Info Side Panel */}
          <div style={{ flex: '1 1 300px', padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', borderLeft: '1px solid var(--border, rgba(0, 0, 0, 0.1))' }}>
            <h1 style={{ margin: '0 0 1.5rem 0', fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 }}>{item.title}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--hover, rgba(0, 0, 0, 0.05))', padding: '0.5rem 1rem', borderRadius: '8px' }}><ShieldCheck size={16} /> Securely Shared</span>
              <span style={{ background: 'var(--hover, rgba(0, 0, 0, 0.05))', padding: '0.5rem 1rem', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ext.split('.').pop()} FILE</span>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '3rem', width: '100%' }}>
              <a 
                href={`/api/media/${item.id}?download=true`} 
                download 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', background: 'var(--primary, #4f46e5)', color: 'white', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 600, fontSize: '1.05rem', transition: 'background 0.2s', boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.3)' }}
              >
                <Download size={20} />
                Download File
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
