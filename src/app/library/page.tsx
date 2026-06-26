'use client';

import { useEffect, useState } from 'react';
import type { MediaItem } from '@/lib/db';
import { Play, Download, Trash2, X, ArrowUpRight, Wand2, Music } from 'lucide-react';

export default function LibraryPage() {
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await fetch('/api/library');
        const data = await res.json();
        setLibrary(data.library || []);
      } catch (e) {}
    };
    fetchLibrary();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Media Library</h1>
        {library.length > 0 && (
          <button 
            onClick={async () => {
              if (confirm('Are you sure you want to permanently delete ALL videos from your library? This cannot be undone.')) {
                await fetch('/api/library', { method: 'DELETE' });
                setLibrary([]);
                setPlayingId(null);
              }
            }}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border)',
              background: 'var(--card-bg)', color: '#ef4444', cursor: 'pointer',
              fontWeight: 500, fontSize: '0.9rem', transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}
          >
            <Trash2 size={16} />
            Clear Library
          </button>
        )}
      </div>

      {/* Image Converter Promo Banner */}
      <a
        href="https://www.lootops.website/converter"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))',
          border: '1px solid rgba(139,92,246,0.2)', borderRadius: '16px',
          padding: '1.1rem 1.5rem', marginBottom: '2rem', textDecoration: 'none',
          color: 'var(--foreground)', transition: 'all 0.25s', backdropFilter: 'blur(10px)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(236,72,153,0.14))';
          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(139,92,246,0.12)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.08))';
          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          <Wand2 size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.15rem' }}>
            Need to convert your image format?
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Visit our free Image Converter — JPG, PNG, WebP, AVIF &amp; more. No upload limits.
          </div>
        </div>
        <ArrowUpRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      </a>

      {playingId && (
        <div style={{ 
          marginBottom: '2.5rem', 
          background: 'var(--card-bg)', 
          borderRadius: '16px', 
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)'
        }}>
          {(() => {
            const file = library.find(i => i.id === playingId)?.filename?.toLowerCase();
            if (!file) return null;
            
            const isAudio = file.endsWith('.mp3') || file.endsWith('.m4a');
            const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].some(ext => file.endsWith(ext));
            
            if (isAudio) {
              return (
                <div style={{ padding: '3rem 2rem', background: 'linear-gradient(145deg, var(--hover) 0%, var(--card-bg) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(var(--primary-rgb), 0.3)' }}>
                    <Music size={40} color="white" />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center', color: 'var(--foreground)' }}>{library.find(i => i.id === playingId)?.title}</h3>
                  <audio src={`/api/media/${playingId}`} controls autoPlay style={{ width: '100%', maxWidth: '600px', height: '54px', borderRadius: '8px' }} />
                </div>
              );
            }
            
            if (isImage) {
              return (
                <div style={{ width: '100%', background: '#050505', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                  <img src={`/api/media/${playingId}`} alt="Image" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '25px', /* Since images don't have video controls, we can put it lower */
                    right: '25px',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    opacity: 0.85,
                    zIndex: 10
                  }}>
                    <img src="/icon.png" alt="" style={{ width: '80px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                  </div>
                </div>
              );
            }
            
            return (
              <div style={{ width: '100%', background: '#050505', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <video src={`/api/media/${playingId}`} controls autoPlay style={{ width: '100%', maxHeight: '70vh' }} />
                <div style={{
                  position: 'absolute',
                  bottom: '65px',
                  right: '25px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  opacity: 0.85,
                  zIndex: 10
                }}>
                  <img src="/icon.png" alt="" style={{ width: '80px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                </div>
              </div>
            );
          })()}
          
          <div style={{ 
            display: 'flex', gap: '0.75rem', padding: '1.25rem', 
            background: 'var(--card-bg)', borderTop: '1px solid var(--border)',
            justifyContent: 'flex-end', flexWrap: 'wrap'
          }}>
            <a 
              href={`/api/media/${playingId}?download=true`} 
              download 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.7rem 1.25rem', background: 'var(--primary)', color: 'white', textDecoration: 'none', 
                fontWeight: 500, borderRadius: '9999px', fontSize: '0.9rem', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <Download size={18} />
              Save to Device
            </a>
            
            <button 
              onClick={async () => {
                if (confirm('Are you sure you want to permanently delete this file?')) {
                  await fetch(`/api/media/${playingId}`, { method: 'DELETE' });
                  setLibrary(prev => prev.filter(i => i.id !== playingId));
                  setPlayingId(null);
                }
              }}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.7rem 1.25rem', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                cursor: 'pointer', fontWeight: 500, borderRadius: '9999px', fontSize: '0.9rem', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = '#ef4444'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
            >
              <Trash2 size={18} />
              Delete
            </button>
            
            <button 
              onClick={() => setPlayingId(null)}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.7rem 1.25rem', background: 'var(--hover)', color: 'var(--foreground)', border: 'none',
                cursor: 'pointer', fontWeight: 500, borderRadius: '9999px', fontSize: '0.9rem', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--hover)'; }}
            >
              <X size={18} />
              Close
            </button>
          </div>
        </div>
      )}

      {library.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-muted)' }}>Your library is empty. Go download something!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {library.map(item => (
            <div 
              key={item.id} 
              style={{ background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)', transition: 'transform 0.2s' }}
              onClick={() => setPlayingId(item.id)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                {(() => {
                  const isImageFile = item.filename && ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].some(ext => item.filename.toLowerCase().endsWith(ext));
                  const isVideoFile = item.filename && ['.mp4', '.webm', '.mkv', '.mov'].some(ext => item.filename.toLowerCase().endsWith(ext));
                  
                  if (isImageFile) {
                    return <img src={`/api/media/${item.id}`} alt={item.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />;
                  }

                  if (isVideoFile) {
                    return (
                      <>
                        <video src={`/api/media/${item.id}#t=0.1`} preload="metadata" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                          <Play size={40} color="white" opacity={0.9} />
                        </div>
                      </>
                    );
                  }
                  
                  // Fallback for audio or unknown
                  return (
                    <>
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Music size={40} opacity={0.5} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
                        <Play size={40} color="white" opacity={0.9} />
                      </div>
                    </>
                  );
                })()}
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.8)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                  {item.filename.split('.').pop()?.toUpperCase()}
                </div>
              </div>
              <div style={{ padding: '1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                  {item.title}
                </h3>
                <button
                  onClick={async (e) => {
                    e.stopPropagation(); // prevent opening the player
                    if (confirm('Delete this video?')) {
                      await fetch(`/api/media/${item.id}`, { method: 'DELETE' });
                      setLibrary(prev => prev.filter(i => i.id !== item.id));
                      if (playingId === item.id) setPlayingId(null);
                    }
                  }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    padding: '0.2rem', borderRadius: '4px', transition: 'color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  title="Delete Video"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
