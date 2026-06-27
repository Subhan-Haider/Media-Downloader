'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Music, Loader2, Zap, HardDrive, Globe, ShieldCheck, UserX, CloudOff, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { blogs } from '../data/blogs';
import styles from './page.module.css';

export default function Home() {
  const [urls, setUrls] = useState<string[]>(['']);
  const [quality, setQuality] = useState('best');
  const [availableQualities, setAvailableQualities] = useState<number[]>([]);
  const [metadata, setMetadata] = useState<Record<number, { title?: string, thumbnail?: string, duration?: string }>>({});
  const [fetchingQualities, setFetchingQualities] = useState(false);
  const [loading, setLoading] = useState<'video' | 'audio' | 'image' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessKeysRequired, setAccessKeysRequired] = useState(false);
  const [accessKey, setAccessKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [sponsorHtml, setSponsorHtml] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAuthAndSettings = async () => {
      try {
        const [authRes, settingsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/settings')
        ]);
        const authData = await authRes.json();
        const settingsData = await settingsRes.json();
        
        setIsAdmin(authData.isAdmin);
        setAccessKeysRequired(settingsData.accessKeysRequired);
        if (settingsData.settings?.sponsorHtml && !authData.isAdmin) {
          setSponsorHtml(settingsData.settings.sponsorHtml);
        }
        
        // If we have an access key saved in local storage, use it
        const savedKey = localStorage.getItem('accessKey');
        if (savedKey && settingsData.accessKeysRequired && !authData.isAdmin) {
          router.push('/' + savedKey);
        }
      } catch (e) {}
    };
    fetchAuthAndSettings();
  }, []);

  // Fetch metadata for each valid URL
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    urls.forEach((url, i) => {
      if (!url || !url.startsWith('http')) {
        setMetadata(prev => { const next = { ...prev }; delete next[i]; return next; });
        // Only update qualities from the first URL
        if (i === 0) { setAvailableQualities([]); setQuality('best'); }
        return;
      }
      const timer = setTimeout(async () => {
        if (i === 0) setFetchingQualities(true);
        try {
          const res = await fetch('/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          });
          const data = await res.json();
          if (data.title || data.thumbnail) {
            setMetadata(prev => ({ ...prev, [i]: { title: data.title, thumbnail: data.thumbnail, duration: data.duration } }));
          }
          if (i === 0 && data.qualities && data.qualities.length > 0) {
            setAvailableQualities(data.qualities);
            setQuality(String(data.qualities[0]));
          }
        } catch (e) {
          setMetadata(prev => { const next = { ...prev }; delete next[i]; return next; });
        } finally {
          if (i === 0) setFetchingQualities(false);
        }
      }, 1000);
      timers.push(timer);
    });
    return () => timers.forEach(t => clearTimeout(t));
  }, [JSON.stringify(urls)]);

  const handleDownload = async (type: 'video' | 'audio' | 'image') => {
    const validUrls = urls.filter(u => u.trim().startsWith('http'));
    if (validUrls.length === 0) return;
    
    setLoading(type);
    try {
      for (const url of validUrls) {
        const res = await fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, type, quality, embedSubs: true, isPrivate, accessKey }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.error === 'Invalid access key' || data.error === 'Access key limit reached') {
            setIsUnlocked(false);
            localStorage.removeItem('accessKey');
          }
          throw new Error(data.error || 'Failed to queue');
        }
      }
      router.push('/queue');
    } catch (e: any) {
      alert(`Request failed: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleUnlock = async () => {
    try {
      const res = await fetch('/api/access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: accessKey })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        localStorage.setItem('accessKey', accessKey);
        router.push('/' + accessKey);
      } else {
        alert(data.error || 'Invalid key');
      }
    } catch (e) {
      alert('Failed to validate key');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '0 1rem' }}>
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0) 70%)', filter: 'blur(60px)', zIndex: -1, pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', marginBottom: '5rem', position: 'relative' }}>
        <div style={{ display: 'inline-block', padding: '0.4rem 1.2rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '100px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '1.5rem', backdropFilter: 'blur(10px)' }}>
          MEDIA SERVER 2.0 IS LIVE
        </div>
        <h1 className="hero-title" style={{ fontWeight: 800, margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1, textShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          Download <br />
          <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', color: 'transparent', textShadow: '0 0 40px rgba(79, 70, 229, 0.2)' }}>Anything.</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem', marginTop: '1.5rem', opacity: 0.9, maxWidth: '600px', margin: '1.5rem auto 0 auto', lineHeight: 1.6 }}>
          The fastest, most secure way to save videos and audio locally. No ads, no tracking, pure speed.
        </p>
      </div>

      {sponsorHtml && !isAdmin && (
        <div style={{ width: '100%', maxWidth: '800px', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }} dangerouslySetInnerHTML={{ __html: sponsorHtml }} />
      )}

      {accessKeysRequired && !isAdmin && !isUnlocked ? (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'center' }}>
          <ShieldCheck size={48} color="var(--primary)" style={{ margin: '0 auto' }} />
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Private Server</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>This downloader is currently locked. Enter an access key to continue.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <input 
              type="password" 
              placeholder="Enter Access Key"
              value={accessKey}
              onChange={e => setAccessKey(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.05)', fontSize: '1.1rem' }}
            />
            <button 
              onClick={handleUnlock}
              style={{ padding: '0 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
            >
              Unlock
            </button>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Already claimed a space?</p>
            <Link href="/private" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Log In to Private Portal</Link>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>

        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {urls.map((url, i) => (
            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="https://youtube.com/..."
                value={url}
                onChange={(e) => updateUrl(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDownload('video')}
                autoFocus={i === urls.length - 1}
                style={{ 
                  width: '100%', padding: '1.4rem 1.8rem', fontSize: '1.2rem', borderRadius: '20px', 
                  background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--foreground)',
                  outline: 'none', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02), 0 4px 20px rgba(0,0,0,0.05)',
                  backdropFilter: 'blur(10px)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 4px rgba(139, 92, 246, 0.2), 0 4px 30px rgba(139, 92, 246, 0.1)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0,0,0,0.1)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02), 0 4px 20px rgba(0,0,0,0.05)';
                  e.target.style.transform = 'translateY(0)';
                }}
              />
              {urls.length > 1 && (
                <button 
                  onClick={() => {
                    const newUrls = [...urls];
                    newUrls.splice(i, 1);
                    setUrls(newUrls);
                  }}
                  style={{ position: 'absolute', right: '1.2rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', backdropFilter: 'blur(5px)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1)'; }}
                  title="Remove URL"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              )}
            </div>
          ))}
        </div>

        <button 
          onClick={() => setUrls([...urls, ''])}
          style={{ 
            background: 'rgba(0, 0, 0, 0.02)', border: '1px dashed rgba(0,0,0,0.15)', color: 'var(--text-muted)', cursor: 'pointer', 
            fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '1.2rem', width: '100%', borderRadius: '20px', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'; e.currentTarget.style.color = 'var(--foreground)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>+</span> Add another URL
        </button>
        
        {Object.keys(metadata).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {Object.entries(metadata).map(([idx, meta]) => (
              <div key={idx} style={{ 
                display: 'flex', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.5)', padding: '1.25rem', 
                borderRadius: '20px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'left',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)'
              }}>
                {meta.thumbnail ? (
                  <img src={meta.thumbnail} alt="thumb" style={{ width: '140px', height: '79px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '140px', height: '79px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.05rem', lineHeight: 1.3, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.title || 'Unknown Video'}</h3>
                  {meta.duration && (
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
                      Duration: {Math.floor(Number(meta.duration) / 60)}:{String(Number(meta.duration) % 60).padStart(2, '0')}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {availableQualities.length > 0 && (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                Highest available quality is <strong>{availableQualities[0] >= 2160 ? '4K' : availableQualities[0] >= 1440 ? '2K' : availableQualities[0] + 'p'}</strong>.
              </p>
            )}
          </div>
        )}

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem 1.2rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--foreground)' }}>
            <input 
              type="checkbox" 
              id="privateToggle" 
              checked={isPrivate} 
              onChange={e => setIsPrivate(e.target.checked)} 
              style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: '#ef4444' }}
            />
            <label htmlFor="privateToggle" style={{ cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} color="#ef4444" />
              Download Privately (Admin Only)
            </label>
          </div>
        )}

        <div className="download-buttons">
          {/* Quality selector */}
          <select 
            value={quality} 
            onChange={(e) => setQuality(e.target.value)}
            disabled={fetchingQualities || availableQualities.length === 0}
            style={{
              height: '56px', padding: '0 1.2rem', fontSize: '0.95rem', borderRadius: '14px',
              background: 'rgba(255,255,255,0.9)', color: 'var(--foreground)',
              border: '1.5px solid rgba(0,0,0,0.1)', outline: 'none', cursor: 'pointer',
              fontWeight: 600, opacity: fetchingQualities ? 0.6 : 1,
              transition: 'all 0.2s', flexShrink: 0, backdropFilter: 'blur(10px)',
              minWidth: '140px'
            }}
            onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)', e.currentTarget.style.background = 'rgba(255,255,255,1)')}
            onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)', e.currentTarget.style.background = 'rgba(255,255,255,0.9)')}
          >
            {fetchingQualities ? (
              <option value="best">Loading...</option>
            ) : availableQualities.length > 0 ? (
              <>
                <option value="best" style={{background: '#ffffff'}}>Best Quality</option>
                {availableQualities.map(h => (
                  <option key={h} value={h} style={{background: '#ffffff'}}>
                    {h >= 2160 ? `4K (${h}p)` : h >= 1440 ? `2K (${h}p)` : `${h}p`}
                  </option>
                ))}
              </>
            ) : (
              <option value="best" style={{background: '#ffffff'}}>Best Quality</option>
            )}
          </select>

          {/* Download Video */}
          <button 
            onClick={() => handleDownload('video')}
            disabled={loading !== null || urls.every(u => !u.trim())}
            style={{ 
              flex: 2, height: '56px', fontSize: '1rem', borderRadius: '14px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white', border: 'none', whiteSpace: 'nowrap',
              cursor: loading !== null || urls.every(u => !u.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              fontWeight: 700, opacity: loading !== null || urls.every(u => !u.trim()) ? 0.6 : 1,
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)'
            }}
            onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.5)')}
            onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)')}
            onMouseDown={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(1px) scale(0.98)')}
          >
            {loading === 'video' ? <Loader2 size={18} className="spinner" /> : <Download size={18} />}
            {urls.filter(u => u.trim()).length > 1 ? `Download (${urls.filter(u => u.trim()).length})` : 'Download Video'}
          </button>

          {/* Audio */}
          <button 
            onClick={() => handleDownload('audio')}
            disabled={loading !== null || urls.every(u => !u.trim())}
            style={{ 
              flex: 1, height: '56px', fontSize: '1rem', borderRadius: '14px', whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              color: 'white', border: 'none',
              cursor: loading !== null || urls.every(u => !u.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              fontWeight: 700, opacity: loading !== null || urls.every(u => !u.trim()) ? 0.6 : 1,
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 4px 20px rgba(236,72,153,0.35)'
            }}
            onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 28px rgba(236,72,153,0.5)')}
            onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 20px rgba(236,72,153,0.35)')}
            onMouseDown={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(1px) scale(0.98)')}
          >
            {loading === 'audio' ? <Loader2 size={18} className="spinner" /> : <Music size={18} />}
            Audio
          </button>

          {/* Image */}
          <button 
            onClick={() => handleDownload('image')}
            disabled={loading !== null || urls.every(u => !u.trim())}
            style={{ 
              flex: 1, height: '56px', fontSize: '1rem', borderRadius: '14px', whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white', border: 'none',
              cursor: loading !== null || urls.every(u => !u.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
              fontWeight: 700, opacity: loading !== null || urls.every(u => !u.trim()) ? 0.6 : 1,
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 4px 20px rgba(16,185,129,0.35)'
            }}
            onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 8px 28px rgba(16,185,129,0.5)')}
            onMouseLeave={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = '0 4px 20px rgba(16,185,129,0.35)')}
            onMouseDown={e => !e.currentTarget.disabled && (e.currentTarget.style.transform = 'translateY(1px) scale(0.98)')}
          >
            {loading === 'image' ? <Loader2 size={18} className="spinner" /> : <ImageIcon size={18} />}
            Image
          </button>
        </div>

      </div>
      )}

      <div style={{ marginTop: '5rem', width: '100%', maxWidth: '1000px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', padding: '0 1rem' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 10px rgba(79, 70, 229, 0.05)' }}>
            <Globe size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontWeight: 800 }}>1000+ Sites</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>Supports YouTube, TikTok, Twitter, Instagram, Reddit, and hundreds more.</p>
        </div>

        <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(219, 39, 119, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 10px rgba(219, 39, 119, 0.05)' }}>
            <Zap size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontWeight: 800 }}>Blazing Fast</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>Utilizes maximum bandwidth to fetch raw media streams instantly.</p>
        </div>

        <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 10px rgba(16, 185, 129, 0.05)' }}>
            <HardDrive size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontWeight: 800 }}>Local Storage</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>Files are permanently saved to your physical hard drive. Complete ownership.</p>
        </div>

        <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 10px rgba(245, 158, 11, 0.05)' }}>
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontWeight: 800 }}>Private & Secure</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>No tracking. No external servers logging your downloads. 100% private.</p>
        </div>

        <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 10px rgba(139, 92, 246, 0.05)' }}>
            <UserX size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontWeight: 800 }}>No Signup Required</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>Start downloading immediately. No accounts, no logins, no premium tiers.</p>
        </div>

        <div className="glass-panel" style={{ padding: '3rem 2rem', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 10px rgba(99, 102, 241, 0.05)' }}>
            <CloudOff size={28} />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontWeight: 800 }}>Zero Cloud Storage</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>We don't hold your files hostage. Everything goes straight to your device.</p>
        </div>
      </div>

      <section style={{ marginTop: '8rem', maxWidth: '800px', width: '100%', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '1rem' }}>Simple by Design</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '4rem', lineHeight: 1.6 }}>
          Three quick steps in any browser. No extensions, no accounts, no bloat. <br/> Works exactly the same on Windows, Mac, iPhone, and Android.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 }}>1</div>
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Copy the URL</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Find any public video on YouTube, TikTok, Twitter/X, SoundCloud, Vimeo, Twitch, or Streamable and copy the link from your address bar or the Share button.</p>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 }}>2</div>
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Paste & pick format</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Paste the URL into the box above. Our server automatically detects the highest available quality—up to true 4K (2160p) HDR—or you can choose audio-only MP3.</p>
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 }}>3</div>
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Download instantly</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Your file processes locally and saves directly to your Media Library. No waiting in line, no fake download buttons, and absolutely no malware.</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '8rem', maxWidth: '800px', width: '100%', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '1rem' }}>Formats & Quality</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '3rem', lineHeight: 1.6 }}>
          We support every common video and audio format.<br/>Always original source quality, no compression or re-encoding.
        </p>

        <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.05)' }}>
                <th style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>Format</th>
                <th style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>Best for</th>
                <th style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>Quality</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>MP4 4K (2160p)</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Largest screens, archival, editing</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ background: 'var(--primary)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>Ultra HD</span>
                </td>
              </tr>
              <tr>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>MP4 1440p (2K)</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>High-refresh monitors, sharp editing</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>Quad HD</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>MP4 1080p</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Most desktops, TVs, modern phones</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>Full HD</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>MP4 720p</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Tablets, slower connections</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>HD</td>
              </tr>
              <tr>
                <td style={{ padding: '1.5rem', fontWeight: 600 }}>MP3 Audio</td>
                <td style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>Music, podcasts, lectures</td>
                <td style={{ padding: '1.5rem' }}>Up to 320 kbps</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: '8rem', maxWidth: '800px', width: '100%', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '1rem' }}>Why Media Server?</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '4rem', lineHeight: 1.6 }}>
          A video downloader that actually respects your time. <br/> No ads, no fake buttons, no bundled malware.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: 'var(--primary)' }}>No fake buttons or pop-ups</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>No misleading "Download" buttons that open junk tabs. No forced redirects. The buttons on this page are the only ones you'll ever click.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: 'var(--accent)' }}>Real 4K, real HD, no watermark</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Other tools claim 4K but ship 720p re-encoded. We pull the highest-quality master stream each platform offers and save it untouched.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: '#10b981' }}>Fast, predictable downloads</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Direct fetch with no waiting room and no "analyzing video" spinners. Most clips finish in seconds.</p>
          </div>
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: '#f59e0b' }}>Complete Privacy</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>Files stream directly to your local machine. We don’t log your history and we don’t track your IPs.</p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '8rem', maxWidth: '800px', width: '100%', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '1rem' }}>One Downloader. Endless Platforms.</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '3rem', lineHeight: 1.6 }}>
          Paste any supported URL into the box. We pick the right extractor automatically.
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
          {['YouTube', 'TikTok', 'Twitter / X', 'SoundCloud', 'Vimeo', 'Dailymotion', 'Bandcamp', 'Mixcloud', 'Twitch', 'Streamable', 'Reddit', 'Instagram'].map(platform => (
            <div key={platform} style={{ padding: '0.8rem 1.5rem', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border)', borderRadius: '100px', fontWeight: 600, color: 'var(--foreground)' }}>
              {platform}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '8rem', maxWidth: '800px', width: '100%', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '3rem' }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Do I need to create an account?</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>No. This tool is completely free and requires zero signup. Just paste a link and go.</p>
          </div>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Is there a length limit on the videos I can download?</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>No. You can download a 10-second meme or a 10-hour podcast. Your only limit is your hard drive space.</p>
          </div>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Can I download TikTok videos without a watermark?</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>Yes. When you download a TikTok video through this server, it fetches the clean, un-watermarked source file straight from their CDN.</p>
          </div>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Where do the files go?</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>Everything downloads straight to the Library tab, and the raw files are saved directly onto your physical hard drive in the `data/library` folder.</p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '8rem', maxWidth: '1000px', width: '100%', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Guides and deep dives</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1.6 }}>
            Long-form coverage of downloading, formats, legality, and tricks.<br/> Updated constantly as platforms change.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {blogs.map(blog => (
            <a key={blog.id} href={`/blog/${blog.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="glass-panel" style={{ borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', overflow: 'hidden' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 20px 40px rgba(0,0,0,0.1), 0 0 20px ${blog.color}20`; e.currentTarget.style.borderColor = `${blog.color}80`; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                <div style={{ width: '100%', height: '200px', flexShrink: 0, background: 'var(--secondary)' }}>
                  <img src={blog.imageUrl} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: blog.color, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{blog.readTime}</div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 700, lineHeight: 1.3 }}>{blog.title}</h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, margin: 0 }}>{blog.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '8rem', marginBottom: '4rem', maxWidth: '800px', width: '100%', padding: '0 1rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to download?</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>
          Free forever. No account required. Zero limits.
        </p>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ 
            padding: '1.2rem 3rem', fontSize: '1.2rem', borderRadius: '100px', 
            background: 'var(--foreground)', color: 'var(--background)', border: 'none',
            cursor: 'pointer', fontWeight: 700, transition: 'transform 0.2s',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Scroll up to start
        </button>
      </section>
    </div>
  );
}
