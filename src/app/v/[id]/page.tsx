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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb', color: '#111827', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Simple Header */}
      <header style={{ padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/watermark.png" alt="Logo" style={{ width: '28px', height: 'auto', opacity: 0.9 }} />
          <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', color: '#111827' }}>Media Downloader</span>
        </div>
        <a 
          href={`/api/media/${item.id}?download=true`} 
          download 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#111827', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', transition: 'background 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
        >
          <Download size={16} />
          Save File
        </a>
      </header>

      {/* Main Content (Hug Media Layout) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        
        <div style={{ 
          width: isAudioFile ? '450px' : 'fit-content', 
          maxWidth: '100%', 
          background: 'white', 
          borderRadius: '16px', 
          overflow: 'hidden', 
          border: '1px solid #e5e7eb', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' 
        }}>
          
          {/* Media Player Area */}
          <div style={{ width: '100%', background: '#000', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {isImageFile && (
              <img src={`/api/media/${item.id}`} alt={item.title} style={{ display: 'block', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            )}
            
            {isVideoFile && (
              <video 
                src={`/api/media/${item.id}`} 
                poster={item.thumbnail} 
                controls 
                autoPlay 
                style={{ display: 'block', maxWidth: '100%', maxHeight: '70vh' }} 
              />
            )}
            
            {isAudioFile && (
              <div style={{ padding: '3rem 2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', background: 'white' }}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="Cover" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                ) : (
                  <div style={{ width: '120px', height: '120px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Music size={48} color="#9ca3af" />
                  </div>
                )}
                <audio src={`/api/media/${item.id}`} controls autoPlay style={{ width: '100%', height: '40px' }} />
              </div>
            )}
          </div>
          
          {/* Media Info Footer */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'white', borderTop: '1px solid #f3f4f6' }}>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4, color: '#111827', maxWidth: '600px' }}>{item.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#4b5563', fontSize: '0.85rem', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f3f4f6', padding: '0.3rem 0.8rem', borderRadius: '6px' }}><ShieldCheck size={14} /> Securely Shared</span>
              <span style={{ background: '#f3f4f6', padding: '0.3rem 0.8rem', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ext.split('.').pop()} FILE</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
