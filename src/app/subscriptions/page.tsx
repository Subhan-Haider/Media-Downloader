'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { Subscription } from '@/lib/db';

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchSubs = async () => {
    try {
      const res = await fetch('/api/subscriptions');
      const data = await res.json();
      setSubs(data.subscriptions || []);
    } catch (e) {}
  };

  useEffect(() => {
    fetchSubs();
  }, []);

  const handleAdd = async () => {
    if (!url) return;
    setLoading(true);
    await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', url })
    });
    setUrl('');
    setLoading(false);
    fetchSubs();
  };

  const handleRemove = async (id: string) => {
    await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', id })
    });
    fetchSubs();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      });
      const data = await res.json();
      alert(`Synced! Added ${data.queuedCount || 0} new videos to the download queue.`);
    } catch (e) {}
    setSyncing(false);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Subscriptions</h1>
        <button 
          onClick={handleSync}
          disabled={syncing || subs.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {syncing ? <Loader2 size={18} className="spinner" /> : <RefreshCw size={18} />}
          Sync All
        </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste Channel URL here..."
          style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
        />
        <button 
          onClick={handleAdd}
          disabled={loading || !url}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', background: 'var(--accent)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? <Loader2 size={20} className="spinner" /> : <Plus size={20} />}
          Add Channel
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {subs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-muted)' }}>You haven't subscribed to any channels yet.</p>
          </div>
        ) : subs.map(sub => (
          <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>{sub.title}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>{sub.url}</p>
            </div>
            <button 
              onClick={() => handleRemove(sub.id)}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
