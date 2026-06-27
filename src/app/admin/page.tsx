'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Server, HardDrive, Cpu, Activity, Settings, RefreshCw, Terminal, Trash2, X, Users, UserPlus, UserMinus } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tools state
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchAdmins();
    fetchAuth();
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
    } catch (e) {}
  };

  const handleAdminAction = async (action: 'add' | 'remove', email: string) => {
    if (action === 'remove' && !confirm(`Are you sure you want to remove ${email} from admins?`)) return;
    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else setAdmins(data.admins);
      setNewAdminEmail('');
    } catch (e) {
      alert('Failed to update admins');
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Memory Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <Activity size={20} />
            <h3 style={{ margin: 0 }}>Memory Usage</h3>
          </div>
          {loading || !stats ? (
            <p>Loading...</p>
          ) : (
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '4px' }}>
                {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                {formatBytes(stats.memory.free)} free
              </p>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--primary)', width: `${(stats.memory.used / stats.memory.total) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* CPU Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <Cpu size={20} />
            <h3 style={{ margin: 0 }}>CPU Stats</h3>
          </div>
          {loading || !stats ? (
            <p>Loading...</p>
          ) : (
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '4px' }}>
                {stats.cpu.cores} Cores
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stats.cpu.model}
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Load Avg (1m, 5m, 15m):<br/>
                {stats.cpu.loadAvg.map((n: number) => n.toFixed(2)).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Disk Space Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <HardDrive size={20} />
            <h3 style={{ margin: 0 }}>Storage (Disk)</h3>
          </div>
          {loading || !stats ? (
            <p>Loading...</p>
          ) : stats.disk ? (
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '4px' }}>
                {formatBytes(stats.disk.available)} Free
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Total: {formatBytes(stats.disk.total)}
              </p>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '1rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#10b981', width: `${((stats.disk.total - stats.disk.available) / stats.disk.total) * 100}%` }} />
              </div>
            </div>
          ) : (
            <p>Disk stats unavailable</p>
          )}
        </div>

        {/* System Info Card */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            <Server size={20} />
            <h3 style={{ margin: 0 }}>Environment</h3>
          </div>
          {loading || !stats ? (
            <p>Loading...</p>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Platform</span>
                  <span>{stats.os.platform} ({stats.os.release})</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Node.js</span>
                  <span>{stats.node.version}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Server Uptime</span>
                  <span>{Math.floor(stats.os.uptime / 3600)} hrs {Math.floor((stats.os.uptime % 3600) / 60)} mins</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
              style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: 'var(--hover)', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 500, width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
            >
              {isScanning ? 'Scanning...' : 'Run Integrity Scan'}
            </button>

            {scanResult && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
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
                style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)', color: 'var(--foreground)' }}
              />
              <button 
                onClick={() => handleAdminAction('add', newAdminEmail)}
                disabled={!newAdminEmail.includes('@')}
                style={{ padding: '0.7rem 1.5rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <UserPlus size={18} />
                Add Admin
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {admins.map(email => (
                <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 500 }}>{email} {email === 'setupg98@gmail.com' && <span style={{ color: 'var(--primary)', fontSize: '0.8rem', marginLeft: '8px', fontWeight: 700 }}>(SUPER ADMIN)</span>}</span>
                  {email !== 'setupg98@gmail.com' && (
                    <button 
                      onClick={() => handleAdminAction('remove', email)}
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
