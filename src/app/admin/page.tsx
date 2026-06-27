'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Server, HardDrive, Cpu, Activity, Settings, RefreshCw, Terminal, Trash2, X, Users, UserPlus, UserMinus, Palette, Edit2, Check, Pause, Play, Unlock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tools state
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [admins, setAdmins] = useState<{email: string, role: string}[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('limited');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // User Management
  const [users, setUsers] = useState<any[]>([]);

  // Access Keys
  const [accessKeys, setAccessKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyMaxGb, setNewKeyMaxGb] = useState(5);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editKeyName, setEditKeyName] = useState('');
  const [editKeyMaxGb, setEditKeyMaxGb] = useState(5);

  // Branding State
  const [themeColor, setThemeColor] = useState('#0070f3');
  const [siteTitle, setSiteTitle] = useState('Media Server');
  const [siteDescription, setSiteDescription] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAdmins();
    fetchAuth();
    fetchSettings();
    fetchKeys();
    fetchUsers();
    // Poll every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const json = await res.json();
        setStats(json.data);
      } else {
        setError('Failed to load stats');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching stats');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/admin/scan');
      const data = await res.json();
      setScanResult(data);
    } catch (e) {
      alert('Failed to scan library');
    }
    setIsScanning(false);
  };

  const handleClean = async (action: 'clean_orphans' | 'remove_missing') => {
    try {
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      alert(`Successfully processed ${data.cleanedCount} items.`);
      handleScan();
    } catch (e) {
      alert('Failed to process');
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setShowLogs(true);
    } catch (e) {}
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/whitelist');
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch (e) {}
  };

  const fetchAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setIsSuperAdmin(data.isSuperAdmin);
      setUserRole(data.role);
    } catch (e) {}
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/admin/keys');
      const data = await res.json();
      setAccessKeys(data.keys || []);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        if (data.settings.themeColor) setThemeColor(data.settings.themeColor);
        if (data.settings.siteTitle) setSiteTitle(data.settings.siteTitle);
        if (data.settings.siteDescription) setSiteDescription(data.settings.siteDescription);
        if (data.settings.announcementText !== undefined) setAnnouncementText(data.settings.announcementText);
      }
    } catch (e) {}
  };

  const saveBranding = async () => {
    setSavingBrand(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { themeColor, siteTitle, siteDescription, announcementText } })
      });
      alert('Branding updated successfully! Refresh the page to see changes.');
    } catch (e) {
      alert('Failed to save branding.');
    }
    setSavingBrand(false);
  };

  const handleAdminAction = async (action: 'add' | 'remove', email: string, role?: string) => {
    if (action === 'remove' && !confirm(`Are you sure you want to remove ${email} from admins?`)) return;
    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, role })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else setAdmins(data.admins);
      setNewAdminEmail('');
      fetchUsers(); // Refresh users list too
    } catch (e) {
      alert('Failed to update admins');
    }
  };

  const handleUserAction = async (action: 'disable_2fa' | 'change_email' | 'delete' | 'toggle_2fa_requirement', email: string) => {
    let newEmail = undefined;
    if (action === 'delete' && !confirm(`Are you sure you want to completely delete ${email}?`)) return;
    if (action === 'disable_2fa' && !confirm(`Are you sure you want to disable 2FA for ${email}?`)) return;
    if (action === 'change_email') {
      newEmail = prompt(`Enter new email for ${email}:`);
      if (!newEmail) return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email, newEmail })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else {
        fetchUsers();
        fetchAdmins();
        fetchKeys();
      }
    } catch (e) {
      alert('Failed to manage user');
    }
  };

  const handleKeyAction = async (action: 'create' | 'delete' | 'update', keyId?: string, updateData?: any) => {
    try {
      let keyData = updateData;
      if (action === 'create') {
        const randomKey = Math.random().toString(36).slice(-8);
        keyData = { key: randomKey, name: newKeyName, maxGb: newKeyMaxGb, usedGb: 0 };
      }
      const res = await fetch('/api/admin/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, keyId, keyData })
      });
      const data = await res.json();
      if (data.keys) setAccessKeys(data.keys);
      if (action === 'create') setNewKeyName('');
      if (action === 'update') setEditingKey(null);
    } catch (e) {
      alert('Failed to manage key');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <ShieldAlert size={32} color="var(--primary)" />
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Admin Dashboard</h1>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid red', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        
        {/* Memory Gauge */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 220px', minWidth: '220px' }}>
          {loading || !stats ? <p style={{ margin: 0 }}>Loading...</p> : (
            <>
              <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray={`${(stats.memory.used / stats.memory.total) * 97.4} 97.4`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                  {Math.round((stats.memory.used / stats.memory.total) * 100)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Memory</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatBytes(stats.memory.used)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of {formatBytes(stats.memory.total)}</div>
              </div>
            </>
          )}
        </div>

        {/* CPU Gauge */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 220px', minWidth: '220px' }}>
          {loading || !stats ? <p style={{ margin: 0 }}>Loading...</p> : (
            <>
              <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#ec4899" strokeWidth="3" strokeDasharray={`${Math.min(stats.cpu.loadAvg[0] / stats.cpu.cores * 97.4, 97.4)} 97.4`} strokeLinecap={stats.cpu.loadAvg[0] === 0 ? "butt" : "round"} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                  {Math.round(Math.min(stats.cpu.loadAvg[0] / stats.cpu.cores * 100, 100))}%
                </div>
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPU</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{stats.cpu.cores} Cores</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={stats.cpu.model}>{stats.cpu.model}</div>
              </div>
            </>
          )}
        </div>

        {/* Disk Gauge */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 220px', minWidth: '220px' }}>
          {loading || !stats ? <p style={{ margin: 0 }}>Loading...</p> : stats.disk ? (
            <>
              <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${((stats.disk.total - stats.disk.available) / stats.disk.total) * 97.4} 97.4`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700 }}>
                  {Math.round(((stats.disk.total - stats.disk.available) / stats.disk.total) * 100)}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Disk</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{formatBytes(stats.disk.total - stats.disk.available)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>of {formatBytes(stats.disk.total)}</div>
              </div>
            </>
          ) : <p style={{ margin: 0 }}>No disk info</p>}
        </div>

        {/* Environment Mini */}
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 220px', minWidth: '220px' }}>
          {loading || !stats ? <p style={{ margin: 0 }}>Loading...</p> : (
            <>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Server size={22} color="#6366f1" />
              </div>
              <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>OS:</span> <strong>{stats.os.platform}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Node:</span> <strong>{stats.node.version}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Up:</span> <strong>{Math.floor(stats.os.uptime / 3600)}h {Math.floor((stats.os.uptime % 3600) / 60)}m</strong></div>
              </div>
            </>
          )}
        </div>

      </div>

      {(userRole === 'super' || userRole === 'full') && (
        <>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>Configuration</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage your YouTube cookies, Discord webhook, and queue settings.</p>
            </div>
            <Link href="/settings" style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
              background: 'var(--primary)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 500
            }}>
              <Settings size={18} />
              Go to Settings
            </Link>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Branding & Communication</h2>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <Palette size={20} />
            <h3 style={{ margin: 0 }}>Global Brand Settings</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Site Title</label>
              <input 
                type="text" 
                value={siteTitle}
                onChange={e => setSiteTitle(e.target.value)}
                style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#ffffff', color: '#111' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>SEO Description</label>
              <input 
                type="text" 
                value={siteDescription}
                onChange={e => setSiteDescription(e.target.value)}
                style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#ffffff', color: '#111' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Theme Color</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="color" 
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
                />
                <input 
                  type="text" 
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                  style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#ffffff', color: '#111' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Global Announcement Banner</label>
              <input 
                type="text" 
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                placeholder="E.g. Server maintenance tonight! (Leave blank to hide banner)"
                style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#ffffff', color: '#111' }}
              />
            </div>

          </div>
          <button 
            onClick={saveBranding}
            disabled={savingBrand}
            style={{ marginTop: '1.5rem', padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 500 }}
          >
            {savingBrand ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Access Keys (Visible to all admins) */}
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Access Keys & Limits</h2>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              If you generate Access Keys, regular users MUST enter a key to download media. Admins bypass this.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Friend's Name" 
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#ffffff', color: '#111' }}
              />
              <input 
                type="number" 
                placeholder="Max GB" 
                value={newKeyMaxGb}
                onChange={e => setNewKeyMaxGb(Number(e.target.value))}
                style={{ width: '100px', padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#ffffff', color: '#111' }}
              />
              <button 
                onClick={() => handleKeyAction('create')}
                disabled={!newKeyName}
                style={{ padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 500 }}
              >
                Generate Key
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {accessKeys.map(k => {
                const isEditing = editingKey === k.key;
                return (
                  <div key={k.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--border)', opacity: k.isActive === false ? 0.6 : 1 }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={editKeyName}
                          onChange={e => setEditKeyName(e.target.value)}
                          style={{ flex: 1, padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.9rem', background: 'transparent', color: '#111' }}
                        />
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'rgba(0,0,0,0.08)', padding: '2px 6px', borderRadius: '4px', marginRight: '0.5rem' }}>
                          Key: {k.key}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <span>{k.name}</span>
                          {k.ownerEmail && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                              Claimed: {k.ownerEmail}
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                            Downloads: {k.downloadsCount || 0}
                          </span>
                          {k.isActive === false && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                              Paused
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace', background: 'rgba(0,0,0,0.08)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                          Key: {k.key}
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: '1rem' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Limit (GB):</span>
                          <input 
                            type="number" 
                            value={editKeyMaxGb}
                            onChange={e => setEditKeyMaxGb(Number(e.target.value))}
                            style={{ width: '70px', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.9rem', background: 'transparent', color: '#111' }}
                          />
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.9rem' }}>
                          <span style={{ color: k.usedGb >= k.maxGb ? '#ef4444' : 'var(--text-primary)' }}>{k.usedGb.toFixed(2)} GB</span> / {k.maxGb} GB
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {isEditing ? (
                          <>
                            <button 
                              onClick={() => handleKeyAction('update', k.key, { name: editKeyName, maxGb: editKeyMaxGb })}
                              style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }}
                              title="Save"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => setEditingKey(null)}
                              style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                              title="Cancel"
                            >
                              <X size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleKeyAction('update', k.key, { isActive: k.isActive === false ? true : false })}
                              style={{ background: 'transparent', border: 'none', color: k.isActive === false ? '#10b981' : '#f59e0b', cursor: 'pointer', padding: '4px' }}
                              title={k.isActive === false ? "Resume Key" : "Pause Key"}
                            >
                              {k.isActive === false ? <Play size={18} /> : <Pause size={18} />}
                            </button>
                            <button 
                              onClick={() => { if(confirm('Reset used GB to 0?')) handleKeyAction('update', k.key, { usedGb: 0 }) }}
                              style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                              title="Reset Data Usage"
                            >
                              <RefreshCw size={18} />
                            </button>
                            {k.ownerEmail && (
                              <button 
                                onClick={() => { if(confirm('Revoke claim so someone else can use this key?')) handleKeyAction('update', k.key, { ownerEmail: null }) }}
                                style={{ background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: '4px' }}
                                title="Revoke Claim"
                              >
                                <Unlock size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setEditingKey(k.key);
                                setEditKeyName(k.name);
                                setEditKeyMaxGb(k.maxGb);
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => { if(confirm('Are you sure you want to delete this key?')) handleKeyAction('delete', k.key) }}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Delete Key"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {accessKeys.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No keys active. Public access is currently open to everyone.</div>}
            </div>
          </div>
        </div>
      </div>
      </>
      )}

      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Admin Tools</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          {/* Integrity Scanner */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <RefreshCw size={20} />
              <h3 style={{ margin: 0 }}>Library Scanner</h3>
            </div>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Find orphaned files (taking up disk space but not in DB) and missing entries (in DB but missing from disk).
            </p>
            <button
              onClick={handleScan}
              disabled={isScanning}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: 'var(--hover)', color: '#111', cursor: 'pointer', fontWeight: 500, width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              {isScanning ? 'Scanning...' : 'Run Integrity Scan'}
            </button>

            {scanResult && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#ffffff', borderRadius: '8px' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Orphaned Files: {scanResult.orphanedFiles.length}</strong>
                  {scanResult.orphanedFiles.length > 0 && (
                    <button onClick={() => handleClean('clean_orphans')} style={{ marginLeft: '1rem', padding: '0.3rem 0.6rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete Files</button>
                  )}
                </div>
                <div>
                  <strong>Missing DB Entries: {scanResult.missingEntries.length}</strong>
                  {scanResult.missingEntries.length > 0 && (
                    <button onClick={() => handleClean('remove_missing')} style={{ marginLeft: '1rem', padding: '0.3rem 0.6rem', background: '#eab308', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Remove from DB</button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logs Viewer */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <Terminal size={20} />
              <h3 style={{ margin: 0 }}>Server Logs</h3>
            </div>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              View live background download logs and debug errors directly from the UI.
            </p>
            <button
              onClick={fetchLogs}
              style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 500, width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              Open Live Logs
            </button>
          </div>

        </div>
      </div>

      {isSuperAdmin && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Access Control</h2>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <Users size={20} />
              <h3 style={{ margin: 0 }}>Admin Whitelist</h3>
            </div>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Users in this list can access the Admin Dashboard and change system settings via Google Login.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <input 
                type="email" 
                placeholder="user@gmail.com" 
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#ffffff', color: '#111' }}
              />
              <select 
                value={newAdminRole}
                onChange={e => setNewAdminRole(e.target.value)}
                style={{ padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: '#ffffff', color: '#111' }}
              >
                <option value="full">Full Admin</option>
                <option value="limited">Limited Admin</option>
              </select>
              <button 
                onClick={() => handleAdminAction('add', newAdminEmail, newAdminRole)}
                disabled={!newAdminEmail.includes('@')}
                style={{ padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <UserPlus size={18} />
                Add Admin
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {admins.map(admin => (
                <div key={admin.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 500 }}>
                    {admin.email} 
                    {admin.role === 'super' && <span style={{ color: 'var(--primary)', fontSize: '0.8rem', marginLeft: '8px', fontWeight: 700 }}>(SUPER ADMIN)</span>}
                    {admin.role === 'full' && <span style={{ color: '#10b981', fontSize: '0.8rem', marginLeft: '8px', fontWeight: 700 }}>(FULL ADMIN)</span>}
                    {admin.role === 'limited' && <span style={{ color: '#f59e0b', fontSize: '0.8rem', marginLeft: '8px', fontWeight: 700 }}>(LIMITED ADMIN)</span>}
                  </span>
                  {admin.role !== 'super' && (
                    <button 
                      onClick={() => handleAdminAction('remove', admin.email)}
                      title="Remove Admin"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <UserMinus size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Management */}
      {(isSuperAdmin || userRole === 'full') && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>User Management</h2>
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              <Users size={20} />
              <h3 style={{ margin: 0 }}>Registered Users</h3>
            </div>
            <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Manage all registered accounts, change emails, and disable 2FA if users lose access.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {users.map(u => (
                <div key={u.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {u.email} 
                      {u.role === 'super' && <span style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 700 }}>(SUPER ADMIN)</span>}
                      {u.role === 'full' && <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>(FULL ADMIN)</span>}
                      {u.role === 'limited' && <span style={{ color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700 }}>(LIMITED ADMIN)</span>}
                      {u.role === 'regular' && <span style={{ color: '#8b5cf6', fontSize: '0.7rem', fontWeight: 700 }}>(USER)</span>}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: u.totpEnabled ? '#10b981' : (u.totpRequired ? '#ef4444' : '#9ca3af') }}>
                      2FA: {u.totpEnabled ? 'Active' : (u.totpRequired ? 'Required (Pending Setup)' : 'Bypassed')}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {u.totpEnabled && (
                      <button 
                        onClick={() => handleUserAction('disable_2fa', u.email)}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: '#f59e0b', cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem' }}
                        title="Disable 2FA"
                      >
                        Disable 2FA
                      </button>
                    )}
                    <button 
                      onClick={() => handleUserAction('toggle_2fa_requirement', u.email)}
                      style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: u.totpRequired ? '#f59e0b' : '#10b981', cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem' }}
                      title={u.totpRequired ? "Make 2FA optional for this user" : "Force this user to set up 2FA"}
                    >
                      {u.totpRequired ? "Don't Require 2FA" : "Require 2FA"}
                    </button>
                    {u.role !== 'super' && (
                      <button 
                        onClick={() => handleUserAction('change_email', u.email)}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--primary)', cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem' }}
                        title="Change Email"
                      >
                        Change Email
                      </button>
                    )}
                    {u.role !== 'super' && (
                      <button 
                        onClick={() => handleUserAction('delete', u.email)}
                        style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', fontSize: '0.8rem' }}
                        title="Delete User"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {users.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No users found.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ background: '#1e1e1e', width: '100%', maxWidth: '800px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Terminal size={18} /> Server Logs (Last 200 events)</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={fetchLogs} style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>Refresh</button>
                <button onClick={() => setShowLogs(false)} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {logs.length === 0 ? <span style={{ color: '#888' }}>No logs available.</span> : logs.map((log, i) => (
                <div key={i} style={{ color: log.type === 'error' ? '#ef4444' : log.type === 'warn' ? '#eab308' : '#a3a3a3' }}>
                  <span style={{ color: '#666', marginRight: '8px' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
