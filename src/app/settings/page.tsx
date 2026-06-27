'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Check, RotateCcw } from 'lucide-react';

const NOTIFICATION_GROUPS = [
  {
    group: '📥 Download Lifecycle',
    events: [
      { event: 'queued',     label: 'Download Queued',       desc: 'When a URL is added to the queue' },
      { event: 'started',    label: 'Download Started',      desc: 'When yt-dlp begins downloading' },
      { event: 'watermark',  label: 'Watermark Applying',    desc: 'When watermark processing starts' },
      { event: 'completed',  label: 'Download Completed ✅', desc: 'When file is saved to library' },
      { event: 'error',      label: 'Download Failed ❌',    desc: 'When a download errors out' },
      { event: 'cancelled',  label: 'Download Cancelled',    desc: 'When user cancels a download' },
    ]
  },
  {
    group: '🌐 Platform Detection',
    events: [
      { event: 'youtube_queued',      label: 'YouTube',      desc: 'YouTube URL queued' },
      { event: 'instagram_queued',    label: 'Instagram',    desc: 'Instagram URL queued' },
      { event: 'twitter_queued',      label: 'Twitter / X',  desc: 'Twitter/X URL queued' },
      { event: 'reddit_queued',       label: 'Reddit',       desc: 'Reddit URL queued' },
      { event: 'soundcloud_queued',   label: 'SoundCloud',   desc: 'SoundCloud URL queued' },
      { event: 'facebook_queued',     label: 'Facebook',     desc: 'Facebook URL queued' },
      { event: 'direct_image_queued', label: 'Direct Image', desc: 'Direct image URL queued' },
    ]
  },
  {
    group: '🔍 Search & Processing',
    events: [
      { event: 'url_lookup',        label: 'URL Lookup',          desc: 'When someone searches a URL' },
      { event: 'playlist_detected', label: 'Playlist Detected',   desc: 'When a playlist URL is found' },
      { event: 'audio_conversion',  label: 'Audio Conversion',    desc: 'When MP3 conversion runs' },
      { event: 'subtitles_embedded',label: 'Subtitles Embedded',  desc: 'When subtitles are added to video' },
      { event: 'rate_limit_error',  label: 'Rate Limit Hit 🚦',   desc: 'When yt-dlp gets throttled' },
      { event: 'browser_auth_used', label: 'Browser Auth Used 🍪',desc: 'When browser cookies are used' },
    ]
  },
  {
    group: '👁️ Visitor Analytics',
    events: [
      { event: 'share_visit',    label: 'Share Page Visited',   desc: 'When someone opens a shared link' },
      { event: 'file_download',  label: 'File Downloaded',      desc: 'When a visitor saves a file' },
      { event: 'media_streamed', label: 'Media Played',         desc: 'When media is streamed in browser' },
      { event: 'media_not_found',label: 'Dead Link Visited 🔴', desc: 'When a share link leads to 404' },
    ]
  },
  {
    group: '📚 Library & Files',
    events: [
      { event: 'file_deleted',   label: 'File Deleted',       desc: 'When a single file is deleted' },
      { event: 'library_cleared',label: 'Library Cleared 💣', desc: 'When all library files are wiped' },
      { event: 'large_file',     label: 'Large File (>100MB)',desc: 'When a very large file is downloaded' },
    ]
  },
  {
    group: '📡 Subscriptions',
    events: [
      { event: 'subscription_added',   label: 'Channel Subscribed',   desc: 'New channel subscription added' },
      { event: 'subscription_removed', label: 'Channel Unsubscribed', desc: 'Channel subscription removed' },
      { event: 'subscriptions_synced', label: 'Subscriptions Synced', desc: 'Sync ran and queued new videos' },
    ]
  },
  {
    group: '⚙️ System',
    events: [
      { event: 'settings_changed', label: 'Settings Changed', desc: 'When storage settings are updated' },
    ]
  },
];

const ALL_EVENTS = NOTIFICATION_GROUPS.flatMap(g => g.events.map(e => e.event));

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [ytCookies, setYtCookies] = useState('');
  const [savingCookies, setSavingCookies] = useState(false);
  const [cookiesSaved, setCookiesSaved] = useState(false);

  const [igCookies, setIgCookies] = useState('');
  const [savingIgCookies, setSavingIgCookies] = useState(false);
  const [igCookiesSaved, setIgCookiesSaved] = useState(false);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(d => setPrefs(d.preferences || {}));
  }, []);

  const isEnabled = (event: string) => prefs[event] !== false; // default true

  const toggle = async (event: string) => {
    const newVal = !isEnabled(event);
    setSaving(event);
    setPrefs(p => ({ ...p, [event]: newVal }));
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, enabled: newVal }),
    });
    setSaving(null);
    setSaved(event);
    setTimeout(() => setSaved(null), 1500);
  };

  const enableAll = async () => {
    const updates = ALL_EVENTS.reduce((acc, e) => ({ ...acc, [e]: true }), {});
    setPrefs(updates);
    for (const event of ALL_EVENTS) {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, enabled: true }),
      });
    }
  };

  const disableAll = async () => {
    const updates = ALL_EVENTS.reduce((acc, e) => ({ ...acc, [e]: false }), {});
    setPrefs(updates);
    for (const event of ALL_EVENTS) {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, enabled: false }),
      });
    }
  };

  const enabledCount = ALL_EVENTS.filter(e => isEnabled(e)).length;

  const saveCookies = async (type: 'youtube' | 'instagram') => {
    const isYt = type === 'youtube';
    const cookieStr = isYt ? ytCookies : igCookies;
    const setSaving = isYt ? setSavingCookies : setSavingIgCookies;
    const setSaved = isYt ? setCookiesSaved : setIgCookiesSaved;
    const clearCookies = isYt ? setYtCookies : setIgCookies;

    setSaving(true);
    try {
      await fetch('/api/cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: cookieStr, type }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      clearCookies('');
    } catch (e) {
      console.error(e);
      alert(`Failed to save ${type} cookies`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .notif-page { max-width: 860px; margin: 0 auto; padding: 0 0.75rem; box-sizing: border-box; }
        .notif-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .notif-header-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .bulk-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.6rem 1.1rem; border-radius: 10px; cursor: pointer; font-size: 0.85rem; font-weight: 600;
          border: 1px solid var(--border); background: var(--card-bg); color: var(--foreground); transition: all 0.2s;
        }
        .bulk-btn:hover { background: var(--hover); }
        .bulk-btn.danger { color: #ef4444; border-color: rgba(239,68,68,0.3); }
        .bulk-btn.danger:hover { background: rgba(239,68,68,0.1); }
        .bulk-btn.success { color: #22c55e; border-color: rgba(34,197,94,0.3); }
        .bulk-btn.success:hover { background: rgba(34,197,94,0.1); }

        .notif-group { margin-bottom: 2rem; }
        .notif-group-title { font-size: 0.9rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.75rem; text-transform: uppercase; }
        .notif-card {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 14px; overflow: hidden;
        }
        .notif-row {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          transition: background 0.15s;
        }
        .notif-row:last-child { border-bottom: none; }
        .notif-row:hover { background: var(--hover); }
        .notif-info { flex: 1; min-width: 0; }
        .notif-label { font-weight: 600; font-size: 0.95rem; margin-bottom: 0.15rem; }
        .notif-desc { font-size: 0.8rem; color: var(--text-muted); }

        /* Toggle switch */
        .toggle-track {
          position: relative; width: 46px; height: 26px; flex-shrink: 0;
          border-radius: 100px; cursor: pointer; transition: background 0.25s;
        }
        .toggle-track.on  { background: var(--primary); }
        .toggle-track.off { background: var(--border); }
        .toggle-thumb {
          position: absolute; top: 3px;
          width: 20px; height: 20px;
          background: white; border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          transition: left 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .toggle-track.on  .toggle-thumb { left: 23px; }
        .toggle-track.off .toggle-thumb { left: 3px; }

        .save-badge {
          font-size: 0.7rem; font-weight: 700; color: #22c55e;
          display: flex; align-items: center; gap: 0.25rem;
          opacity: 0; transition: opacity 0.2s;
        }
        .save-badge.show { opacity: 1; }

        .status-bar {
          padding: 1rem 1.25rem; background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 14px; margin-bottom: 2rem;
          display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;
        }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }
        @media (max-width: 480px) {
          .notif-row { padding: 0.85rem 1rem; }
          .notif-desc { display: none; }
        }
      `}</style>

      <div className="notif-page">
        <div className="notif-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Authentication and Notification Preferences
            </p>
          </div>
          <div className="notif-header-actions">
            <button className="bulk-btn success" onClick={enableAll}>
              <Bell size={15} /> Enable All
            </button>
            <button className="bulk-btn danger" onClick={disableAll}>
              <BellOff size={15} /> Disable All
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="status-bar">
          <div className="status-dot" />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700 }}>{enabledCount} / {ALL_EVENTS.length}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>notifications active</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Changes save instantly
          </div>
        </div>

        <div className="notif-group">
          <div className="notif-group-title">Platform Authentication</div>
          <div className="notif-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>YouTube Cookies</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              Paste your exported YouTube cookies here (Netscape format) to bypass age restrictions and login walls. 
            </p>
            <textarea
              value={ytCookies}
              onChange={e => setYtCookies(e.target.value)}
              placeholder="# Netscape HTTP Cookie File&#10;..."
              style={{
                width: '100%',
                height: '100px',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.02)',
                color: 'var(--foreground)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                resize: 'vertical',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="bulk-btn success" 
                onClick={() => saveCookies('youtube')}
                disabled={savingCookies || !ytCookies.trim()}
                style={{ opacity: (savingCookies || !ytCookies.trim()) ? 0.5 : 1 }}
              >
                {savingCookies ? 'Saving...' : 'Save YouTube Cookies'}
              </button>
              <div className={`save-badge ${cookiesSaved ? 'show' : ''}`} style={{ display: 'flex' }}>
                <Check size={14} /> Saved successfully!
              </div>
            </div>
          </div>

          <div className="notif-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Instagram Cookies</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              Paste your exported Instagram cookies here (Netscape format) to download private posts, stories, and reels. 
            </p>
            <textarea
              value={igCookies}
              onChange={e => setIgCookies(e.target.value)}
              placeholder="# Netscape HTTP Cookie File&#10;..."
              style={{
                width: '100%',
                height: '100px',
                padding: '1rem',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.02)',
                color: 'var(--foreground)',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                resize: 'vertical',
                marginBottom: '1rem'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="bulk-btn success" 
                onClick={() => saveCookies('instagram')}
                disabled={savingIgCookies || !igCookies.trim()}
                style={{ opacity: (savingIgCookies || !igCookies.trim()) ? 0.5 : 1 }}
              >
                {savingIgCookies ? 'Saving...' : 'Save Instagram Cookies'}
              </button>
              <div className={`save-badge ${igCookiesSaved ? 'show' : ''}`} style={{ display: 'flex' }}>
                <Check size={14} /> Saved successfully!
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="notif-header-actions" style={{ marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Notifications</span>
          <div style={{ flex: 1 }} />
          <button className="bulk-btn success" onClick={enableAll}>
            <Bell size={15} /> Enable All
          </button>
          <button className="bulk-btn danger" onClick={disableAll}>
            <BellOff size={15} /> Disable All
          </button>
        </div>

        {NOTIFICATION_GROUPS.map(({ group, events }) => (
          <div key={group} className="notif-group">
            <div className="notif-group-title">{group}</div>
            <div className="notif-card">
              {events.map(({ event, label, desc }) => {
                const on = isEnabled(event);
                const isSaving = saving === event;
                const wasSaved = saved === event;
                return (
                  <div key={event} className="notif-row">
                    <div className="notif-info">
                      <div className="notif-label" style={{ color: on ? 'var(--foreground)' : 'var(--text-muted)' }}>
                        {label}
                      </div>
                      <div className="notif-desc">{desc}</div>
                    </div>

                    <div className={`save-badge ${wasSaved ? 'show' : ''}`}>
                      <Check size={11} /> Saved
                    </div>

                    <div
                      className={`toggle-track ${on ? 'on' : 'off'}`}
                      onClick={() => !isSaving && toggle(event)}
                      style={{ opacity: isSaving ? 0.5 : 1 }}
                    >
                      <div className="toggle-thumb" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
