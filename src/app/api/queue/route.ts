import { NextResponse } from 'next/server';
import { addToQueue, updateQueueItem, moveToLibrary, readDB, clearErrorsFromQueue } from '@/lib/db';
import youtubedl from 'youtube-dl-exec';
import { join } from 'path';
import { randomBytes } from 'crypto';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ queue: db.queue });
}

export async function DELETE() {
  clearErrorsFromQueue();
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, type, quality = '1080', embedSubs, browserAuth } = body; // type is 'video' or 'audio'

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const id = randomBytes(8).toString('hex');
    const isAudio = type === 'audio';
    const isImage = type === 'image';
    const containerExt = isAudio ? 'mp3' : isImage ? 'jpg' : 'mp4';
    
    // In a real app we'd fetch the title first, but for speed we can let yt-dlp determine it or use a generic one
    const item = {
      id,
      url,
      title: 'Fetching metadata...',
      filename: `${id}.${containerExt}`,
      status: 'queued' as const,
      addedAt: Date.now()
    };
    
    addToQueue(item);

    // Kick off background download
    startDownload(id, url, type, quality, embedSubs, browserAuth).catch(err => {
      console.error('Background download failed:', err);
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper: download a direct image URL to the library folder and move to library
async function downloadImageUrl(id: string, imageUrl: string) {
  const { updateQueueItem, moveToLibrary } = require('@/lib/db');
  const https = require('https');
  const http = require('http');
  const fs = require('fs');
  const { join } = require('path');

  const ext = /\.(jpg|jpeg)/i.test(imageUrl) ? 'jpg'
            : /\.png/i.test(imageUrl) ? 'png'
            : /\.webp/i.test(imageUrl) ? 'webp' : 'jpg';
  const finalPath = join(process.cwd(), 'data', 'library', `${id}.${ext}`);

  updateQueueItem(id, { progress: 'Downloading image...' });

  await new Promise<void>((resolve, reject) => {
    const doGet = (targetUrl: string) => {
      const protocol = targetUrl.startsWith('https') ? https : http;
      protocol.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (response: any) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          doGet(response.headers.location);
        } else {
          const file = fs.createWriteStream(finalPath);
          response.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
          file.on('error', reject);
        }
      }).on('error', reject);
    };
    doGet(imageUrl);
  });

  updateQueueItem(id, { filename: `${id}.${ext}` });
  moveToLibrary(id);
}

async function startDownload(id: string, url: string, type: string, quality: string, embedSubs: boolean, browserAuth?: string) {
  const isAudio = type === 'audio';
  let isImage = type === 'image';
  const containerExt = isAudio ? 'mp3' : isImage ? 'jpg' : 'mp4';
  const outputPath = join(process.cwd(), 'data', 'library', `${id}.%(ext)s`);
  const ffmpegPath = join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

  updateQueueItem(id, { status: 'downloading', progress: 'Fetching metadata...' });

  const isInstagram = url.includes('instagram.com');
  // Instagram no longer supports --username/--password; use a cookies.txt file instead
  const cookiesPath = join(process.cwd(), 'data', 'instagram_cookies.txt');
  const hasCookies = require('fs').existsSync(cookiesPath);

  // --- Instagram image post special handling ---
  if (isInstagram && !isAudio) {
    try {
      const metaOptions: any = {
        dumpJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificates: true
      };
      if (hasCookies) {
        metaOptions.cookies = cookiesPath;
      } else if (browserAuth && browserAuth !== 'none') {
        metaOptions.cookiesFromBrowser = browserAuth;
      }

      const info = await youtubedl(url, metaOptions) as any;

      // Update queue with real title/thumbnail
      const realTitle = info.title || info.description || info.fulltitle || 'Instagram Post';
      const realThumbnail = info.thumbnail || (info.thumbnails?.length > 0 ? info.thumbnails[0].url : undefined);
      updateQueueItem(id, {
        title: realTitle.length > 100 ? realTitle.substring(0, 100) + '...' : realTitle,
        thumbnail: realThumbnail,
        duration: String(info.duration || '')
      });

      // Detect image post: no real video formats
      const hasVideo = info.formats?.some((f: any) => f.vcodec && f.vcodec !== 'none' && f.vcodec !== 'mhtml');
      if (!hasVideo || isImage || type === 'image') {
        isImage = true;
        // Try to get the highest-res image URL from info
        let imageUrl: string | null = null;
        if (info.url && !/\.mp4/i.test(info.url)) {
          imageUrl = info.url;
        } else if (info.thumbnails?.length > 0) {
          const sorted = [...info.thumbnails].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
          imageUrl = sorted[0].url;
        } else if (info.thumbnail) {
          imageUrl = info.thumbnail;
        }

        if (imageUrl) {
          await downloadImageUrl(id, imageUrl);
          return;
        }
      }
    } catch (e: any) {
      const errMsg: string = e?.message || e?.stderr || String(e);
      if (errMsg.toLowerCase().includes('no video') || errMsg.toLowerCase().includes('no video in this post')) {
        // It's a photo post — yt-dlp can't handle it, scrape from Instagram embed endpoint
        isImage = true;
        updateQueueItem(id, { progress: 'Fetching Instagram image...' });

        // Use instaloader python helper to get the raw image URL(s), supporting private posts and carousels
        const imageUrl = await (async () => {
          try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // Extract the shortcode from the URL
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const shortcodeIndex = pathParts.indexOf('p') > -1 ? pathParts.indexOf('p') + 1 : pathParts.indexOf('reel') > -1 ? pathParts.indexOf('reel') + 1 : 0;
            const shortcode = pathParts[shortcodeIndex];
            
            if (!shortcode) return null;

            const helperPath = join(process.cwd(), 'instaloader_helper.py');
            const cmd = hasCookies ? `python "${helperPath}" ${shortcode} "${cookiesPath}"` : `python "${helperPath}" ${shortcode}`;
            
            const { stdout } = await execAsync(cmd);
            const result = JSON.parse(stdout);
            
            if (result.success && result.images && result.images.length > 0) {
              // Just grab the first image for now to maintain single-file library structure
              return result.images[0];
            }
            return null;
          } catch (e) {
            console.error("Instaloader helper failed:", e);
            return null;
          }
        })();

        if (imageUrl) {
          await downloadImageUrl(id, imageUrl);
        } else {
          updateQueueItem(id, { status: 'error', error: 'Could not fetch Instagram image. The post might be completely private or removed.' });
        }
        return;
      }
      // Other error — log and fall through to normal download
      console.warn(`Failed to fetch Instagram metadata for ${id}: ${errMsg}`);
    }
  } else {
    // Non-Instagram: regular metadata fetch
    try {
      const metaOptions: any = {
        dumpJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificates: true
      };
      if (browserAuth && browserAuth !== 'none') {
        metaOptions.cookiesFromBrowser = browserAuth;
      }
      const info = await youtubedl(url, metaOptions) as any;

      if (!isAudio && !isImage && info.formats) {
        const hasVideo = info.formats.some((f: any) => f.vcodec && f.vcodec !== 'none' && f.vcodec !== 'mhtml');
        if (!hasVideo) isImage = true;
      }

      const realTitle = info.title || info.description || info.fulltitle || 'Unknown Video';
      const realThumbnail = info.thumbnail || (info.thumbnails?.length > 0 ? info.thumbnails[0].url : undefined);
      updateQueueItem(id, {
        title: realTitle.length > 100 ? realTitle.substring(0, 100) + '...' : realTitle,
        thumbnail: realThumbnail,
        duration: String(info.duration || '')
      });
    } catch (e) {
      console.warn(`Failed to fetch metadata for ${id}, continuing anyway...`);
    }
  }

  const formatString = isAudio 
    ? 'bestaudio/best'
    : isImage
      ? null  // No format selector for images — yt-dlp handles them natively
      : quality === 'best' 
        ? 'bestvideo+bestaudio/best'
        : `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]/best`;

  const options: any = {
    o: outputPath,
    ffmpegLocation: ffmpegPath,
    noWarnings: true,
    noCallHome: true,
    noCheckCertificates: true,
  };

  if (formatString) {
    options.f = formatString;
  }

  if (isAudio) {
    options.extractAudio = true;
    options.audioFormat = 'mp3';
  } else if (!isImage) {
    options.mergeOutputFormat = containerExt;
  }

  if (embedSubs) {
    options.writeAutoSubs = true;
    options.embedSubs = true;
  }

  updateQueueItem(id, { progress: 'Starting download...' });

  const { spawn } = require('child_process');
  const ytDlpPath = join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp.exe');
  
  const args = [
    url,
    '-o', outputPath,
    '--ffmpeg-location', ffmpegPath,
    '--no-warnings',
    '--no-call-home',
    '--no-check-certificates',
    '--rm-cache-dir',
    '--write-info-json'
  ];

  // Only pass format selector for video/audio — not for image posts
  if (formatString) {
    args.splice(1, 0, '-f', formatString);
  }

  if (isAudio) {
    args.push('--extract-audio', '--audio-format', 'mp3');
  } else if (!isImage) {
    args.push('--merge-output-format', containerExt);
  }

  if (embedSubs) {
    args.push('--write-auto-subs', '--embed-subs');
  }

  // Inject auth for Instagram (cookies file) or other sites (browser cookies)
  if (isInstagram && hasCookies) {
    args.push('--cookies', cookiesPath);
  } else if (browserAuth && browserAuth !== 'none') {
    args.push('--cookies-from-browser', browserAuth);
  }

  const subprocess = spawn(ytDlpPath, args, {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  subprocess.unref(); // allow the parent to exit independently

  let lastError = '';

  subprocess.stderr.on('data', (data: Buffer) => {
    const text = data.toString();
    if (text.toLowerCase().includes('error')) {
      lastError = text;
    }
  });

  subprocess.stdout.on('data', (data: Buffer) => {
    const text = data.toString();
    const match = text.match(/\[download\]\s+([\d\.]+%) /);
    if (match) {
      updateQueueItem(id, { progress: `Downloading ${match[1]}...` });
    } else if (text.includes('Merging formats into')) {
      updateQueueItem(id, { progress: 'Merging Video & Audio...' });
    } else if (text.includes('Extracting audio')) {
      updateQueueItem(id, { progress: 'Converting to MP3...' });
    } else if (text.includes('Embedding subtitles')) {
      updateQueueItem(id, { progress: 'Embedding Subtitles...' });
    }
  });

  subprocess.on('close', (code: number) => {
    const fs = require('fs');
    const finalMp4 = outputPath.replace('.%(ext)s', '.mp4');
    const finalMp3 = outputPath.replace('.%(ext)s', '.mp3');
    const tempMp4 = outputPath.replace('.%(ext)s', '.temp.mp4');
    const tempMp3 = outputPath.replace('.%(ext)s', '.temp.mp3');
    
    // For images, we don't know the exact extension yt-dlp will choose (.jpg, .webp, .png, etc.)
    // We'll search the directory for a matching file if it's an image
    const findImageFile = () => {
      const libDir = join(process.cwd(), 'data', 'library');
      if (fs.existsSync(libDir)) {
        const files = fs.readdirSync(libDir);
        return files.find((f: string) => f.startsWith(`${id}.`) && !f.endsWith('.temp.mp4') && !f.endsWith('.temp.mp3') && !f.endsWith('.info.json') && !f.endsWith('.vtt'));
      }
      return null;
    };

    const handleSuccess = () => {
      // Parse the generated .info.json to ensure we capture the title even if the initial dumpJson failed
      const infoPath = outputPath.replace('.%(ext)s', '.info.json');
      if (fs.existsSync(infoPath)) {
        try {
          const infoData = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
          const realTitle = infoData.title || infoData.description || infoData.fulltitle || 'Unknown Video';
          const realThumbnail = infoData.thumbnail || (infoData.thumbnails && infoData.thumbnails.length > 0 ? infoData.thumbnails[0].url : undefined);
          
          updateQueueItem(id, {
            title: realTitle.length > 100 ? realTitle.substring(0, 100) + '...' : realTitle,
            thumbnail: realThumbnail,
            duration: String(infoData.duration || '')
          });
          fs.unlinkSync(infoPath);
        } catch(e) {}
      }

      // Clean up orphaned subtitle files if yt-dlp crashed during cleanup
      const vttPath = outputPath.replace('.%(ext)s', '.en.vtt');
      if (fs.existsSync(vttPath)) {
        try { fs.unlinkSync(vttPath); } catch(e) {}
      }

      // If it's an image, update the filename in the queue to match the actual downloaded file
      if (isImage) {
        const imageFile = findImageFile();
        if (imageFile) {
          updateQueueItem(id, { filename: imageFile });
        } else {
          updateQueueItem(id, { status: 'error', error: 'File was not downloaded (post may be private or require login).' });
          return;
        }
      }

      moveToLibrary(id);
    };

    // Fallback: If yt-dlp failed to rename .temp.mp4 to .mp4 due to Windows Defender locks (WinError 32)
    if (!fs.existsSync(finalMp4) && fs.existsSync(tempMp4)) {
      try {
        fs.renameSync(tempMp4, finalMp4);
        handleSuccess();
      } catch(e) {
        // If still locked, wait 2 seconds and retry
        setTimeout(() => {
          try { 
            fs.renameSync(tempMp4, finalMp4); 
            handleSuccess();
          } catch(e) {
            updateQueueItem(id, { status: 'error', error: 'File locked by Windows Defender. Please retry.' });
          }
        }, 2000);
      }
      return;
    }

    if (!fs.existsSync(finalMp3) && fs.existsSync(tempMp3)) {
      try {
        fs.renameSync(tempMp3, finalMp3);
        handleSuccess();
      } catch(e) {
        setTimeout(() => {
          try { fs.renameSync(tempMp3, finalMp3); handleSuccess(); } catch(e) {}
        }, 2000);
      }
      return;
    }

    if (code === 0 || fs.existsSync(finalMp4) || fs.existsSync(finalMp3) || (isImage && findImageFile())) {
      handleSuccess();
    } else {
      updateQueueItem(id, { status: 'error', error: lastError || `Exited with code ${code}` });
    }
  });
}
