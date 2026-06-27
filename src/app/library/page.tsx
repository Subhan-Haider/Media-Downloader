'use client';

import { useEffect, useState } from 'react';
import type { MediaItem } from '@/lib/db';
import { Play, Download, Trash2, X, ArrowUpRight, Wand2, Music, Volume2, Share2, Settings, Repeat, Repeat1, Lock, Unlock, Cloud } from 'lucide-react';

export default function LibraryPage() {
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Video' | 'Audio' | 'Image'>('All');
  const [showSettings, setShowSettings] = useState(false);
  const [autoDeleteDays, setAutoDeleteDays] = useState<number>(2);
  const [enableWatermark, setEnableWatermark] = useState<boolean>(true);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'loop'>('off');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [uploadingExternalId, setUploadingExternalId] = useState<string | null>(null);

  const cycleRepeat = () => {
    setRepeatMode(prev => prev === 'off' ? 'loop' : prev === 'loop' ? 'one' : 'off');
  };

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const res = await fetch('/api/library');
        const data = await res.json();
        setLibrary(data.library || []);
      } catch (e) { }
    };
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.settings) {
          setAutoDeleteDays(data.settings.autoDeleteDays);
          if (data.settings.enableWatermark !== undefined) {
            setEnableWatermark(data.settings.enableWatermark);
          }
        }
      } catch(e) { }
    };
    const fetchAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        setIsAdmin(data.isAdmin);
        setIsSuperAdmin(data.isSuperAdmin);
      } catch(e) { }
    };
    fetchLibrary();
    fetchSettings();
    fetchAuth();
  }, []);

  const saveSettings = async (days: number, watermark?: boolean) => {
    const w = watermark !== undefined ? watermark : enableWatermark;
    setAutoDeleteDays(days);
    setEnableWatermark(w);
    
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { autoDeleteDays: days, enableWatermark: w } })
    });
  };

  const togglePrivacy = async (e: React.MouseEvent, id: string, currentIsPrivate: boolean) => {
    e.stopPropagation();
    const newIsPrivate = !currentIsPrivate;
    
    // Optimistic update
    setLibrary(prev => prev.map(i => i.id === id ? { ...i, isPrivate: newIsPrivate } : i));
    
    try {
      await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: newIsPrivate })
      });
    } catch (e) {
      // Revert if error
      setLibrary(prev => prev.map(i => i.id === id ? { ...i, isPrivate: currentIsPrivate } : i));
    }
  };

  const uploadToExternal = async (id: string) => {
    try {
      setUploadingExternalId(id);
      const res = await fetch('/api/admin/upload-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.error) {
        alert('Upload failed: ' + data.error);
      } else {
        const msg = data.fileUrl 
          ? `✅ Upload successful!\n\nPublic URL:\n${data.fileUrl}`
          : '✅ Successfully uploaded to storage server!';
        alert(msg);
      }
    } catch (e: any) {
      alert('Upload error: ' + e.message);
    } finally {
      setUploadingExternalId(null);
    }
  };

  const filteredLibrary = library.filter(item => {
    if (item.isPrivate && !isAdmin) return false;
    if (filter === 'All') return true;
    if (!item.filename) return false;
    const ext = item.filename.toLowerCase();
    const isImageFile = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].some(e => ext.endsWith(e));
    const isAudioFile = ['.mp3', '.m4a'].some(e => ext.endsWith(e));
    const isVideoFile = ['.mp4', '.webm', '.mkv', '.mov'].some(e => ext.endsWith(e));

    if (filter === 'Image') return isImageFile;
    if (filter === 'Audio') return isAudioFile;
    if (filter === 'Video') return isVideoFile;
    return true;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 0.5rem', boxSizing: 'border-box' }}>
      <div className="page-header">
        <h1 className="page-title">Media Library</h1>
        <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
          {isAdmin && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)',
                background: showSettings ? 'var(--hover)' : 'var(--card-bg)', color: 'var(--foreground)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s'
              }}
            >
              <Settings size={20} />
            </button>
          )}

          {showSettings && (
            <div style={{
              position: 'absolute', top: '100%', right: '0', marginTop: '0.5rem',
              background: 'var(--card-bg)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: '12px',
              padding: '1rem', width: '250px', zIndex: 50, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Storage Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Auto-Delete Files After:</label>
                <select
                  value={autoDeleteDays}
                  onChange={(e) => saveSettings(Number(e.target.value))}
                  style={{
                    padding: '0.5rem', background: 'var(--hover)', color: 'var(--foreground)',
                    border: '1px solid var(--border)', borderRadius: '6px', width: '100%'
                  }}
                >
                  <option value={0}>Never (Keep Forever)</option>
                  <option value={1}>1 Day</option>
                  <option value={2}>2 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                </select>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  This affects all downloaded videos, audios, and images to save server space.
                </p>
              </div>

              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Processing Settings</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  id="watermarkToggle" 
                  checked={enableWatermark}
                  onChange={(e) => saveSettings(autoDeleteDays, e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="watermarkToggle" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                  Apply Watermark (Slow)
                </label>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Applying watermarks requires re-encoding the entire video. Disable this if downloads are getting stuck.
              </p>
            </div>
          )}

          {isAdmin && library.length > 0 && (
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
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Visit our free Image Converter — No download limits, AVIF & more supported!
          </div>
        </div>
        <ArrowUpRight size={20} color="var(--text-muted)" />
      </a>

      {/* Filters */}
      {library.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {(['All', 'Video', 'Audio', 'Image'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '9999px',
                border: 'none',
                background: filter === f ? 'var(--primary)' : 'var(--card-bg)',
                color: filter === f ? 'white' : 'var(--foreground)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: filter === f ? '0 4px 12px rgba(var(--primary-rgb, 0, 112, 243), 0.3)' : 'none'
              }}
            >
              {f === 'All' ? 'All' : f + 's'}
            </button>
          ))}
        </div>
      )}

      {playingId && (
        <div style={{
          marginBottom: '2.5rem',
          background: 'var(--card-bg)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}>
          {(() => {
            const file = library.find(i => i.id === playingId)?.filename?.toLowerCase();
            if (!file) return null;

            const isAudio = file.endsWith('.mp3') || file.endsWith('.m4a');
            const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].some(ext => file.endsWith(ext));

            if (isAudio) {
              const item = library.find(i => i.id === playingId);
              return (
                <div style={{ padding: '2rem 1.25rem', background: 'linear-gradient(145deg, var(--hover) 0%, var(--card-bg) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
                  {item?.thumbnail ? (
                    <img src={item.thumbnail} alt="Cover" style={{ width: 'min(180px, 60vw)', height: 'min(180px, 60vw)', objectFit: 'cover', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.4)' }} />
                  ) : (
                    <div style={{ width: '120px', height: '120px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                      <Music size={50} color="white" />
                    </div>
                  )}
                  <h3 style={{ margin: 0, fontSize: '1.25rem', textAlign: 'center', color: 'var(--foreground)' }}>{item?.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '600px' }}>
                    <audio
                      key={`${playingId}-${repeatMode}`}
                      src={`/api/media/${playingId}`}
                      controls
                      autoPlay
                      loop={repeatMode === 'one' || repeatMode === 'loop'}
                      style={{ flex: 1, height: '54px', borderRadius: '8px' }}
                    />
                    <button
                      onClick={cycleRepeat}
                      title={repeatMode === 'off' ? 'Repeat off' : repeatMode === 'loop' ? 'Repeat all' : 'Repeat once'}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '44px', height: '44px', borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                        background: repeatMode !== 'off' ? 'var(--primary)' : 'var(--hover)',
                        color: repeatMode !== 'off' ? 'white' : 'var(--text-muted)',
                        transition: 'all 0.2s', boxShadow: repeatMode !== 'off' ? '0 4px 12px rgba(79,70,229,0.3)' : 'none'
                      }}
                    >
                      {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                    </button>
                  </div>
                  {repeatMode !== 'off' && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '0.05em' }}>
                      {repeatMode === 'loop' ? '🔁 Repeat On' : '🔂 Repeat Once'}
                    </div>
                  )}
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
                    <img src="/watermark.png" alt="" style={{ width: '80px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                  </div>
                </div>
              );
            }

            return (
              <div style={{ width: '100%', background: '#050505', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <video src={`/api/media/${playingId}`} poster={library.find(i => i.id === playingId)?.thumbnail} controls autoPlay style={{ width: '100%', maxHeight: '70vh' }} />
                <div style={{
                  position: 'absolute',
                  bottom: '45px',
                  right: '10px',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  opacity: 0.85,
                  zIndex: 10
                }}>
                  <img src="/watermark.png" alt="" style={{ width: '80px', height: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                </div>
              </div>
            );
          })()}

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.6rem',
            padding: '1rem',
            background: 'var(--card-bg)',
            borderTop: '1px solid var(--border)',
          }}>
            <button
              onClick={() => {
                const url = `${window.location.origin}/v/${playingId}`;
                navigator.clipboard.writeText(url);
                alert('Share link copied to clipboard!');
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.7rem 0.5rem', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)',
                cursor: 'pointer', fontWeight: 500, borderRadius: '12px', fontSize: '0.875rem', transition: 'all 0.2s', width: '100%'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(var(--primary-rgb, 0, 112, 243), 0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <Share2 size={16} />
              Share Link
            </button>

            <a
              href={`/api/media/${playingId}?download=true`}
              download
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.7rem 0.5rem', background: 'var(--primary)', color: 'white', textDecoration: 'none',
                fontWeight: 500, borderRadius: '12px', fontSize: '0.875rem', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
            >
              <Download size={16} />
              Save to Device
            </a>

            {isSuperAdmin && (
              <button
                onClick={async () => {
                  uploadToExternal(playingId!);
                }}
                disabled={uploadingExternalId === playingId}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.7rem 0.5rem', background: 'transparent', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)',
                  cursor: uploadingExternalId === playingId ? 'wait' : 'pointer', fontWeight: 500, borderRadius: '12px', fontSize: '0.875rem', transition: 'all 0.2s', width: '100%',
                  opacity: uploadingExternalId === playingId ? 0.7 : 1
                }}
                onMouseEnter={e => { if (uploadingExternalId !== playingId) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)' }}
                onMouseLeave={e => { if (uploadingExternalId !== playingId) e.currentTarget.style.background = 'transparent' }}
              >
                <Cloud size={16} />
                {uploadingExternalId === playingId ? 'Uploading...' : 'Upload to Cloud'}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to permanently delete this file?')) {
                    await fetch(`/api/media/${playingId}`, { method: 'DELETE' });
                    setLibrary(prev => prev.filter(i => i.id !== playingId));
                    setPlayingId(null);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.7rem 0.5rem', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer', fontWeight: 500, borderRadius: '12px', fontSize: '0.875rem', transition: 'all 0.2s', width: '100%'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}

            <button
              onClick={() => setPlayingId(null)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '0.7rem 0.5rem', background: 'var(--hover)', color: 'var(--foreground)', border: 'none',
                cursor: 'pointer', fontWeight: 500, borderRadius: '12px', fontSize: '0.875rem', transition: 'all 0.2s', width: '100%'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--hover)' }}
            >
              <X size={16} />
              Close
            </button>
          </div>
        </div>
      )}

      {filteredLibrary.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-muted)' }}>{filter === 'All' ? 'Your library is empty. Go download something!' : `You don't have any downloaded ${filter.toLowerCase()}s.`}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {filteredLibrary.map(item => {
            const isPlaying = item.id === playingId;
            return (
            <div
              key={item.id}
              style={{ 
                background: 'var(--card-bg)', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                cursor: 'pointer', 
                border: isPlaying ? '2px solid var(--primary)' : '1px solid var(--border)', 
                boxShadow: isPlaying ? '0 0 20px rgba(var(--primary-rgb, 0, 112, 243), 0.4)' : 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                transform: isPlaying ? 'scale(1.02)' : 'scale(1)'
              }}
              onClick={() => {
                setPlayingId(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onMouseEnter={(e) => { if (!isPlaying) e.currentTarget.style.transform = 'scale(1.02)' }}
              onMouseLeave={(e) => { if (!isPlaying) e.currentTarget.style.transform = 'scale(1)' }}
            >
              <div style={{ position: 'relative', paddingTop: '56.25%', background: '#000' }}>
                {isPlaying && (
                  <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 20, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} />
                    NOW PLAYING
                  </div>
                )}
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
                          {isPlaying ? <Volume2 size={40} color="var(--primary)" opacity={0.9} /> : <Play size={40} color="white" opacity={0.9} />}
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
                        {isPlaying ? <Volume2 size={40} color="var(--primary)" opacity={0.9} /> : <Play size={40} color="white" opacity={0.9} />}
                      </div>
                    </>
                  );
                })()}
                <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  {item.isPrivate ? (
                    <div 
                      onClick={(e) => isAdmin ? togglePrivacy(e, item.id, true) : undefined}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px',
                        cursor: isAdmin ? 'pointer' : 'default', transition: 'background 0.2s'
                      }} 
                      onMouseEnter={e => { if (isAdmin) e.currentTarget.style.background = 'rgba(220, 38, 38, 1)' }}
                      onMouseLeave={e => { if (isAdmin) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)' }}
                      title={isAdmin ? "Click to make Public" : "Private Download"}
                    >
                      <Lock size={12} />
                    </div>
                  ) : isAdmin ? (
                    <div 
                      onClick={(e) => togglePrivacy(e, item.id, false)}
                      style={{ 
                        background: 'rgba(0, 0, 0, 0.5)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }} 
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'}
                      title="Click to make Private"
                    >
                      <Unlock size={12} />
                    </div>
                  ) : null}
                  <div style={{ background: 'rgba(0,0,0,0.8)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                    {item.filename.split('.').pop()?.toUpperCase()}
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                  {item.title}
                </h3>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {isSuperAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        uploadToExternal(item.id);
                      }}
                      title="Upload to Cloud"
                      disabled={uploadingExternalId === item.id}
                      style={{
                        background: 'none', border: 'none', cursor: uploadingExternalId === item.id ? 'wait' : 'pointer', color: '#10b981',
                        padding: '0.2rem', borderRadius: '4px', transition: 'background 0.2s', opacity: uploadingExternalId === item.id ? 0.5 : 1
                      }}
                      onMouseEnter={e => { if (uploadingExternalId !== item.id) e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)' }}
                      onMouseLeave={e => { if (uploadingExternalId !== item.id) e.currentTarget.style.background = 'none' }}
                    >
                      <Cloud size={18} />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation(); // prevent opening the player
                        if (confirm('Delete this video?')) {
                          await fetch(`/api/media/${item.id}`, { method: 'DELETE' });
                          setLibrary(prev => prev.filter(i => i.id !== item.id));
                          if (playingId === item.id) setPlayingId(null);
                        }
                      }}
                      title="Delete"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        padding: '0.2rem', borderRadius: '4px', transition: 'color 0.2s, background 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
