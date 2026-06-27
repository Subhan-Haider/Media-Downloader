'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Download, ShieldAlert, CheckCircle2, Loader2, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { signInWithGoogle } from '@/lib/firebase';

export default function PersonalSpacePage() {
  const params = useParams();
  const router = useRouter();
  const accessKey = params.accessKey as string;

  const [authStatus, setAuthStatus] = useState<'loading' | 'unclaimed' | 'unauthorized' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<{ name: string; usedGb: number; maxGb: number } | null>(null);
  const [url, setUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [totpState, setTotpState] = useState<'none' | 'setup' | 'verify'>('none');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [authMethod, setAuthMethod] = useState<'totp' | 'email'>('totp');

  const checkAccess = async () => {
    try {
      const res = await fetch('/api/access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: accessKey })
      });
      const data = await res.json();
      
      if (res.ok && data.valid) {
        if (data.claimed) {
          setStats(data);
          setAuthStatus('ready');
          fetchData();
        } else {
          setAuthStatus('unclaimed');
        }
      } else if (res.status === 403 && data.claimed) {
        setAuthStatus('unauthorized');
      } else {
        setErrorMsg(data.error || 'Invalid Access Key');
        setAuthStatus('error');
      }
    } catch (e) {
      setErrorMsg('Server Error');
      setAuthStatus('error');
    }
  };

  useEffect(() => {
    if (accessKey) checkAccess();
  }, [accessKey]);

  const fetchData = async () => {
    try {
      const qRes = await fetch(`/api/queue?accessKey=${accessKey}`);
      const qData = await qRes.json();
      setQueue(qData.queue || []);

      const lRes = await fetch(`/api/library?accessKey=${accessKey}`);
      const lData = await lRes.json();
      setLibrary(lData.library || []);
    } catch (e) {}
  };

  useEffect(() => {
    if (authStatus === 'ready') {
      const interval = setInterval(fetchData, 3000);
      return () => clearInterval(interval);
    }
  }, [authStatus]);

  const handleAuth = async () => {
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      const user = await signInWithGoogle();
      const token = await user.getIdToken();
      setIdToken(token);

      const res = await fetch('/api/access-key/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token, accessKey }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.setupTotp) {
          setQrCodeUrl(data.qrCode);
          setTotpState('setup');
        } else if (data.requiresTotp) {
          setTotpState('verify');
        } else if (data.success) {
          checkAccess(); // Re-check to enter ready state
        }
      } else {
        setErrorMsg(data.error || 'Authentication failed');
        setAuthStatus('error');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during sign in');
      setAuthStatus('error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setErrorMsg('Please enter a 6-digit code');
      return;
    }
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/access-key/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, accessKey, totpCode, authMethod }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        checkAccess();
      } else {
        setErrorMsg(data.error || 'Invalid 2FA code');
        setAuthStatus('error');
      }
    } catch (err: any) {
      setErrorMsg('Failed to verify code');
      setAuthStatus('error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        setAuthMethod('email');
        setTotpState('verify');
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to send email');
      }
    } catch (err: any) {
      setErrorMsg('An error occurred while sending email');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim().startsWith('http')) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type: 'video', quality: 'best', isPrivate: true, accessKey })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to queue');
      setUrl('');
      fetchData();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleLogout = async () => {
    // Clear session by destroying the cookie (requires API endpoint, or just delete client-side if possible)
    // Actually, Firebase session cookies are HTTP-only. We need to tell the server to clear it.
    // We can just redirect them to a logout route or clear the local accessKey.
    // For now, redirecting to home will require them to log in again if they come back.
    // Realistically we need an /api/auth/logout endpoint, but we can do a simple redirect for now.
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/');
  };

  if (authStatus === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1.5rem' }}>
        <ShieldAlert size={64} color="var(--primary)" />
        <h1 style={{ margin: 0 }}>Access Denied</h1>
        <p style={{ color: 'var(--text-muted)' }}>{errorMsg}</p>
        <button onClick={checkAccess} style={{ padding: '0.8rem 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    );
  }

  if (authStatus === 'unclaimed' || authStatus === 'unauthorized') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6rem 1rem', minHeight: '60vh', color: '#111827' }}>
        <div style={{ background: '#ffffff', padding: '4rem 3.5rem', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '550px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            <ShieldCheck size={40} />
          </div>
          <h1 style={{ margin: '0 0 1rem 0', fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.025em' }}>
            {totpState === 'none' 
              ? (authStatus === 'unclaimed' ? 'Claim Your Space' : 'Private Space')
              : 'Two-Step Verification'}
          </h1>
          <p style={{ color: '#6b7280', margin: '0 0 2.5rem 0', lineHeight: '1.6', fontSize: '1.15rem' }}>
            {totpState === 'none' 
              ? (authStatus === 'unclaimed' 
                ? 'Sign in with Google to secure this space. Your downloads will be permanently tied to your account.' 
                : 'This space is private. Sign in with your Google account to access your files.')
              : (totpState === 'setup'
                ? 'Scan this QR code with your Authenticator app (e.g. Google Authenticator) and enter the code below to secure your space.'
                : 'Enter the 6-digit code from your Authenticator app.')}
          </p>

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: '500', width: '100%', textAlign: 'left', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {totpState === 'none' && (
            <button 
              onClick={handleAuth}
              disabled={authLoading}
              style={{ background: '#ffffff', color: '#374151', border: '1px solid #d1d5db', padding: '1rem 2rem', borderRadius: '16px', fontSize: '1.15rem', fontWeight: '600', cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.7 : 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', transition: 'all 0.2s ease' }}
            >
              {!authLoading && (
                <svg viewBox="0 0 24 24" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              {authLoading ? 'Authenticating...' : 'Sign in with Google'}
            </button>
          )}

          {totpState !== 'none' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              {totpState === 'setup' && qrCodeUrl && authMethod === 'totp' && (
                <img src={qrCodeUrl} alt="QR Code" style={{ width: '200px', height: '200px', marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '8px' }} />
              )}
              {authMethod === 'email' && (
                <div style={{ color: '#059669', background: '#d1fae5', padding: '12px', borderRadius: '8px', marginBottom: '1rem', width: '100%', fontSize: '0.95rem', textAlign: 'center' }}>
                  A verification code has been sent to your email.
                </div>
              )}
              <input 
                type="text" 
                placeholder="000000" 
                maxLength={6}
                value={totpCode}
                onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyTotp()}
                style={{ width: '100%', padding: '1rem', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.2em', borderRadius: '12px', border: '1px solid #d1d5db', background: '#f9fafb' }}
                autoFocus
              />
              <button 
                onClick={handleVerifyTotp}
                disabled={authLoading || totpCode.length !== 6}
                style={{ background: '#4f46e5', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.05rem', fontWeight: '600', cursor: (authLoading || totpCode.length !== 6) ? 'not-allowed' : 'pointer', opacity: (authLoading || totpCode.length !== 6) ? 0.7 : 1, width: '100%', transition: 'all 0.2s ease' }}
              >
                {authLoading ? 'Verifying...' : 'Verify Code'}
              </button>
              {authMethod === 'totp' && (
                <button 
                  onClick={handleSendEmailOtp}
                  disabled={authLoading}
                  style={{ background: 'transparent', color: '#4f46e5', border: 'none', padding: '0.5rem', fontSize: '0.95rem', fontWeight: '500', cursor: authLoading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}
                >
                  Send code to email instead
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    );
  }

  const usagePercent = Math.min((stats!.usedGb / stats!.maxGb) * 100, 100);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>Welcome, {stats!.name}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Your Personal Media Dashboard</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,0,0,0.1)', color: 'red', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
          Logout
        </button>
      </div>

      {/* Usage Meter */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Database size={24} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Data Limit</h2>
          <div style={{ marginLeft: 'auto', fontWeight: 600 }}>
            {stats!.usedGb.toFixed(2)} GB <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {stats!.maxGb.toFixed(2)} GB</span>
          </div>
        </div>
        <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--primary)', width: `${usagePercent}%`, transition: 'width 0.5s ease' }} />
        </div>
        {usagePercent >= 100 && (
          <p style={{ color: 'red', fontSize: '0.9rem', marginTop: '1rem' }}>You have reached your data limit. You can no longer download new media.</p>
        )}
      </div>

      {/* Downloader */}
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '3rem', display: 'flex', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Paste URL to download (e.g., https://youtube.com/...)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleDownload()}
          disabled={usagePercent >= 100 || downloading}
          style={{ flex: 1, padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.8)', fontSize: '1.1rem' }}
        />
        <button 
          onClick={handleDownload}
          disabled={usagePercent >= 100 || downloading}
          style={{ padding: '0 2rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: (usagePercent >= 100 || downloading) ? 'not-allowed' : 'pointer', opacity: (usagePercent >= 100 || downloading) ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {downloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
          Download
        </button>
      </div>

      {/* Media Lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* Active Queue */}
        <div>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Active Downloads <span style={{ background: 'var(--primary)', color: 'white', padding: '0.1rem 0.6rem', borderRadius: '100px', fontSize: '0.8rem' }}>{queue.length}</span></h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {queue.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '12px' }}>No active downloads.</div>
            ) : queue.map(item => (
              <div key={item.id} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 className="animate-spin" size={24} color="var(--primary)" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.2rem' }}>{item.progress || 'Starting...'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Library */}
        <div>
          <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Your Files <span style={{ background: 'rgba(0,0,0,0.1)', padding: '0.1rem 0.6rem', borderRadius: '100px', fontSize: '0.8rem' }}>{library.length}</span></h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {library.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '12px' }}>Your library is empty.</div>
            ) : library.map(item => (
              <div key={item.id} className="glass-panel" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt="" style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '6px' }} />
                ) : (
                  <div style={{ width: '80px', height: '45px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={20} color="#10b981" />
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.filename}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
