'use client';

import { useState } from 'react';
import { Download, Loader2, Music, Subtitles } from 'lucide-react';

interface Format {
  itag: number;
  qualityLabel: string;
  hasVideo: boolean;
  hasAudio: boolean;
  container: string;
  contentLength: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  formats: Format[];
}

interface VideoResultProps {
  info: VideoInfo;
  url: string;
}

export default function VideoResult({ info, url }: VideoResultProps) {
  const [downloadingId, setDownloadingId] = useState<number | string | null>(null);
  const [embedSubs, setEmbedSubs] = useState(false);

  const formatDuration = (seconds: string) => {
    const sec = parseInt(seconds, 10);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: string | undefined) => {
    if (!bytes || bytes === '0') return 'Unknown size';
    const b = parseInt(bytes, 10);
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (format: Format | { itag: string }, extractAudio = false) => {
    // Generate a unique ID for this download
    const tempId = Math.random().toString(36).substring(2, 15);
    setDownloadingId(format.itag);
    
    // Check if we need to poll progress
    if (format.itag === 'best' || extractAudio || (!extractAudio && format.hasVideo && !format.hasAudio)) {
      const pollProgress = setInterval(async () => {
        try {
          const res = await fetch(`/api/progress?id=${tempId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.error) {
              clearInterval(pollProgress);
              setDownloadingId(null);
              alert(`Download Failed: ${data.error}`);
            } else if (data.progress) {
              const el = document.getElementById('progress-text');
              if (el) el.innerText = data.progress;
            }
          }
        } catch (e) {}
      }, 1000);

      // Clean up after 5 mins
      setTimeout(() => clearInterval(pollProgress), 300000);
    }

    const isBest = format.itag === 'best';
    // @ts-ignore
    const needsAudioMerge = !isBest && !extractAudio && format.hasVideo && !format.hasAudio;
    // @ts-ignore
    const container = extractAudio ? 'mp3' : format.container || 'mp4';
    
    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&itag=${format.itag}&title=${encodeURIComponent(info.title)}&ext=${container}&mergeAudio=${needsAudioMerge}&extractAudio=${extractAudio}&embedSubs=${embedSubs}&id=${tempId}`;
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Reset button state after enough time for browser to start the download
    const timeout = isBest || needsAudioMerge || extractAudio ? 180000 : 8000;
    setTimeout(() => {
      setDownloadingId(null);
    }, timeout);
  };

  // Group formats and remove duplicates to have a clean list
  const uniqueFormats = info.formats.reduce((acc, current) => {
    const x = acc.find(item => item.qualityLabel === current.qualityLabel && item.hasVideo === current.hasVideo && item.hasAudio === current.hasAudio);
    if (!x) {
      return acc.concat([current]);
    } else {
      return acc;
    }
  }, [] as Format[]).sort((a, b) => {
    // Sort logic to put best quality first, then audio only
    if (a.hasVideo && !b.hasVideo) return -1;
    if (!a.hasVideo && b.hasVideo) return 1;
    const qA = parseInt(a.qualityLabel) || 0;
    const qB = parseInt(b.qualityLabel) || 0;
    return qB - qA;
  });

  return (
    <div className="result-card">
      <div className="thumbnail-container" style={{ position: 'relative' }}>
        <img src={info.thumbnail} alt={info.title} className="thumbnail" />
        <a 
          href={`/api/thumbnail?url=${encodeURIComponent(info.thumbnail)}&title=${encodeURIComponent(info.title)}`}
          download
          className="download-btn"
          style={{ position: 'absolute', bottom: '10px', right: '10px', padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
        >
          <Download size={16} style={{ marginRight: '0.5rem' }} />
          Download Thumbnail
        </a>
      </div>
      
      <div className="video-info">
        <h2 className="video-title">{info.title}</h2>
        <div className="video-duration">
          <span>Duration: {formatDuration(info.duration)}</span>
        </div>
        
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--primary)' }}>Available Formats</h3>
        
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="embedSubs" 
              checked={embedSubs} 
              onChange={(e) => setEmbedSubs(e.target.checked)}
              style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="embedSubs" style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Include Auto-Generated Subtitles (Embeds into MKV/MP4)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="download-btn"
              style={{ flex: 2, justifyContent: 'center', padding: '1rem', background: 'var(--primary)', fontWeight: 'bold' }}
              onClick={() => handleDownload({ itag: 'best', container: 'mp4', qualityLabel: 'Best', hasVideo: true, hasAudio: true, contentLength: '0' })}
              disabled={downloadingId !== null}
            >
              {downloadingId === 'best' ? (
                <>
                  <Loader2 className="spinner" size={20} />
                  <span id="progress-text">Downloading & Merging...</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Download Best Video (1080p+)</span>
                </>
              )}
            </button>
            <button 
              className="download-btn"
              style={{ flex: 1, justifyContent: 'center', padding: '1rem', background: 'var(--accent)', fontWeight: 'bold' }}
              onClick={() => handleDownload({ itag: 'bestaudio', container: 'm4a', qualityLabel: 'Audio', hasVideo: false, hasAudio: true, contentLength: '0' }, true)}
              disabled={downloadingId !== null}
            >
              {downloadingId === 'bestaudio' ? (
                <>
                  <Loader2 className="spinner" size={20} />
                  <span id="progress-text">Extracting...</span>
                </>
              ) : (
                <>
                  <Music size={20} />
                  <span>Extract MP3</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="formats-list">
          {uniqueFormats.map((format) => (
            <div key={format.itag} className="format-item">
              <div className="format-details">
                <span className="format-quality">
                  {format.qualityLabel} 
                  {!format.hasVideo && ' (Audio Only)'}
                  {!format.hasAudio && format.hasVideo && ' (+ Merged Audio)'}
                </span>
                <span className="format-meta">
                  {format.container.toUpperCase()} • {formatBytes(format.contentLength)}
                </span>
              </div>
              <button 
                className="download-btn"
                onClick={() => handleDownload(format)}
                title="Download"
                disabled={downloadingId !== null}
              >
                {downloadingId === format.itag ? (
                  <>
                    <Loader2 className="spinner" size={18} />
                    <span id="progress-text">{!format.hasAudio && format.hasVideo ? 'Merging...' : 'Starting...'}</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
