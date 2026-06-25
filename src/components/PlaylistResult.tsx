'use client';

import { ListVideo } from 'lucide-react';

interface PlaylistEntry {
  title: string;
  url: string;
  duration?: number;
}

interface PlaylistInfo {
  isPlaylist: boolean;
  title: string;
  entries: PlaylistEntry[];
}

interface PlaylistResultProps {
  info: PlaylistInfo;
  onSelectVideo: (url: string) => void;
}

export default function PlaylistResult({ info, onSelectVideo }: PlaylistResultProps) {
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="result-card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <ListVideo size={32} color="var(--primary)" />
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{info.title}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{info.entries.length} videos in playlist</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '1rem' }}>
        {info.entries.map((entry, index) => (
          <div 
            key={index} 
            className="format-item" 
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}
          >
            <span style={{ color: 'var(--text-secondary)', minWidth: '1.5rem' }}>{index + 1}.</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>{entry.title}</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Duration: {formatDuration(entry.duration)}
              </span>
            </div>
            <button 
              className="download-btn"
              onClick={() => onSelectVideo(entry.url)}
              style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
            >
              Fetch Formats
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
