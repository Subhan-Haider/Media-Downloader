'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, Video, Image as ImageIcon } from 'lucide-react';
import type { MediaItem } from '@/lib/db';

export default function QueuePage() {
  const [queue, setQueue] = useState<MediaItem[]>([]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/queue');
        const data = await res.json();
        setQueue(data.queue || []);
      } catch (e) {}
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    await fetch('/api/queue', { method: 'DELETE' });
    setQueue(prev => prev.filter(i => i.status !== 'error' && i.status !== 'completed'));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Downloads Queue</h1>
        {queue.some(i => i.status === 'error' || i.status === 'completed') && (
          <button 
            onClick={handleClear}
            style={{
              padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border)',
              background: 'var(--card-bg)', color: 'var(--foreground)', cursor: 'pointer',
              fontWeight: 500, fontSize: '0.9rem', transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}
          >
            Clear History
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-muted)' }}>The queue is empty.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {queue.map(item => (
            <div key={item.id} style={{ padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', width: '80px', height: '45px', flexShrink: 0 }}>
                {(() => {
                  const isImageFile = item.filename && ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].some(ext => item.filename.toLowerCase().endsWith(ext));
                  const isLocalImage = item.status === 'completed' && isImageFile;
                  const thumbSrc = isLocalImage ? `/api/media/${item.id}` : item.thumbnail;
                  
                  return (
                    <>
                      {thumbSrc && (
                        <img 
                          src={thumbSrc} 
                          alt="thumb" 
                          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', zIndex: 2 }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'var(--background)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                        {isImageFile ? <ImageIcon size={24} color="var(--text-muted)" /> : <Video size={24} color="var(--text-muted)" />}
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{item.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {item.status === 'downloading' && <Loader2 size={14} className="spinner" />}
                  {item.status === 'error' && <AlertCircle size={14} color="#ef4444" />}
                  {item.status === 'completed' && <CheckCircle size={14} color="#22c55e" />}
                  
                  {item.status === 'error' ? (
                    <span 
                      style={{ 
                        color: '#ef4444', 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        wordBreak: 'break-word'
                      }}
                      title={item.error}
                    >
                      {item.error}
                    </span>
                  ) : (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.progress || item.status}
                    </span>
                  )}
                </div>
              </div>
              
              {item.status === 'completed' && (
                <a 
                  href={`/api/media/${item.id}?download=true`} 
                  download 
                  style={{
                    padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', 
                    borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', 
                    fontWeight: 500, marginLeft: 'auto', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                >
                  Save File
                </a>
              )}
              
              {(item.status === 'downloading' || item.status === 'queued') && (
                <button
                  onClick={async () => {
                    await fetch(`/api/queue?id=${item.id}`, { method: 'DELETE' });
                    setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: 'Cancelled by user' } : i));
                  }}
                  style={{
                    padding: '0.5rem 1rem', background: 'transparent', color: '#ef4444', 
                    border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '0.9rem', fontWeight: 500, marginLeft: 'auto', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
