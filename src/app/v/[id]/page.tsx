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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}>
      
      {/* Cinematic Blurred Background */}
      {item.thumbnail && (
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%',
          backgroundImage: `url('${item.thumbnail}')`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(100px) saturate(150%) brightness(0.3)', zIndex: 0, opacity: 0.8,
          pointerEvents: 'none'
        }} />
      )}
      
      {/* Subtle Gradient Overlay for Depth */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />

      {/* Floating Minimal Header */}
      <header style={{ padding: '2rem 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 50, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.8, transition: 'opacity 0.2s', cursor: 'pointer' }}>
          <img src="/watermark.png" alt="Logo" style={{ width: '28px', height: 'auto', filter: 'brightness(0) invert(1)' }} />
          <span style={{ fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Media Downloader</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 2rem 4rem 2rem', zIndex: 10, position: 'relative' }}>
        
        {/* Dynamic Media Container (Auto-scales based on content) */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          width: '100%', 
          maxWidth: isAudioFile ? '500px' : '1000px', 
          position: 'relative' 
        }}>
          
          {isImageFile && (
            <img src={`/api/media/${item.id}`} alt={item.title} style={{ display: 'block', maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '16px', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }} />
          )}
          
          {isVideoFile && (
            <video 
              src={`/api/media/${item.id}`} 
              poster={item.thumbnail} 
              controls 
              autoPlay 
              style={{ display: 'block', maxWidth: '100%', maxHeight: '65vh', borderRadius: '16px', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000' }} 
            />
          )}
          
          {isAudioFile && (
            <div style={{ padding: '3rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(30px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
              {item.thumbnail ? (
                <img src={item.thumbnail} alt="Cover" style={{ width: '220px', height: '220px', objectFit: 'cover', borderRadius: '50%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '4px solid rgba(255,255,255,0.05)', animation: 'spin 20s linear infinite' }} />
              ) : (
                <div style={{ width: '180px', height: '180px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Music size={64} color="rgba(255,255,255,0.5)" />
                </div>
              )}
              <audio src={`/api/media/${item.id}`} controls autoPlay style={{ width: '100%', height: '48px', filter: 'invert(1) hue-rotate(180deg)', opacity: 0.8 }} />
            </div>
          )}
        </div>
        
        {/* Glassmorphism Info Dashboard */}
        <div style={{ 
          marginTop: '3rem',
          width: '100%', 
          maxWidth: isAudioFile ? '500px' : '800px', 
          background: 'rgba(255, 255, 255, 0.03)', 
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px', 
          padding: '2rem 2.5rem',
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          gap: '2rem'
        }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.3, textShadow: '0 2px 10px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ShieldCheck size={14} color="#10b981" /> Securely Shared</span>
              <span>•</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)' }}>{ext.split('.').pop()} FILE</span>
            </div>
          </div>
          
          <a 
            href={`/api/media/${item.id}?download=true`} 
            download 
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
              background: 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)', 
              color: 'white', padding: '1rem 2rem', borderRadius: '9999px', 
              textDecoration: 'none', fontWeight: 600, fontSize: '1rem', 
              boxShadow: '0 10px 20px -5px rgba(219, 39, 119, 0.4)',
              flexShrink: 0
            }}
          >
            <Download size={18} />
            Download
          </a>
        </div>
        
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
