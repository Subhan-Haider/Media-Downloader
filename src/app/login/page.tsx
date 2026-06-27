'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase';

import { ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [totpState, setTotpState] = useState<'none' | 'setup' | 'verify'>('none');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [authMethod, setAuthMethod] = useState<'totp' | 'email'>('totp');
  
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      const token = await user.getIdToken();
      setIdToken(token);

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
      });

      const data = await res.json();
      
      if (res.ok) {
        if (data.setupTotp) {
          setQrCodeUrl(data.qrCode);
          setTotpState('setup');
        } else if (data.requiresTotp) {
          setTotpState('verify');
        } else if (data.success) {
          router.push('/');
          router.refresh();
        }
      } else {
        setError(data.error || 'Failed to authenticate');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (!totpCode || totpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, totpCode, authMethod }),
      });
      if (res.ok) {
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid 2FA code');
      }
    } catch (err: any) {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setLoading(true);
    setError(null);
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
        setError(data.error || 'Failed to send email');
      }
    } catch (err: any) {
      setError('An error occurred while sending email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', backgroundColor: '#f9fafb', color: '#111827', fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: '#ffffff', padding: '3rem 2.5rem', borderRadius: '24px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01), 0 0 0 1px rgba(0,0,0,0.05)',
        textAlign: 'center', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <ShieldCheck size={32} />
        </div>

        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.025em' }}>
          {totpState === 'none' ? 'Admin Access' : 'Two-Step Verification'}
        </h1>
        <p style={{ color: '#6b7280', margin: '0 0 2rem 0', lineHeight: '1.5', fontSize: '1.05rem' }}>
          {totpState === 'none' 
            ? 'Secure login for server administrators' 
            : totpState === 'setup' 
              ? 'Scan this QR code with your Authenticator app (e.g. Google Authenticator) and enter the code below.'
              : 'Enter the 6-digit code from your Authenticator app.'}
        </p>
        
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: '500', width: '100%', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {totpState === 'none' && (
          <button 
            onClick={handleLogin}
            disabled={loading}
            style={{
              background: '#ffffff', color: '#374151', border: '1px solid #d1d5db', padding: '0.8rem 1.5rem',
              borderRadius: '12px', fontSize: '1.05rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.2s ease',
            }}
          >
            {!loading && (
              <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Authenticating...' : 'Sign in with Google'}
          </button>
        )}

        {totpState !== 'none' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            {totpState === 'setup' && qrCodeUrl && authMethod === 'totp' && (
              <img src={qrCodeUrl} alt="QR Code" style={{ width: '200px', height: '200px', marginBottom: '1rem', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '8px' }} />
            )}
            {authMethod === 'email' && (
              <div style={{ color: '#059669', background: '#d1fae5', padding: '12px', borderRadius: '8px', marginBottom: '1rem', width: '100%', fontSize: '0.95rem' }}>
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
              disabled={loading || totpCode.length !== 6}
              style={{
                background: '#4f46e5', color: 'white', border: 'none', padding: '1rem',
                borderRadius: '12px', fontSize: '1.05rem', fontWeight: '600', cursor: (loading || totpCode.length !== 6) ? 'not-allowed' : 'pointer',
                opacity: (loading || totpCode.length !== 6) ? 0.7 : 1, width: '100%', transition: 'all 0.2s ease',
              }}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            {authMethod === 'totp' && (
              <button 
                onClick={handleSendEmailOtp}
                disabled={loading}
                style={{ background: 'transparent', color: '#4f46e5', border: 'none', padding: '0.5rem', fontSize: '0.95rem', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}
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
