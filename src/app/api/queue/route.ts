import { NextResponse } from 'next/server';
import { addToQueue, updateQueueItem, moveToLibrary, readDB, clearErrorsFromQueue, cleanupOldMedia } from '@/lib/db';
import youtubedl from 'youtube-dl-exec';
import { join } from 'path';
import { randomBytes } from 'crypto';
import fs from 'fs';

export async function GET() {
  cleanupOldMedia(2); // Auto-delete files older than 2 days
  const db = readDB();
  return NextResponse.json({ queue: db.queue });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (id) {
    updateQueueItem(id, { status: 'error', error: 'Cancelled by user', progress: 'Cancelled' });
    return NextResponse.json({ success: true });
  }
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
async function downloadImageUrl(id: string, imageUrl: string, userAgent: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36') {
  const { updateQueueItem, moveToLibrary } = require('@/lib/db');
  const fs = require('fs');
  const { join } = require('path');

  const urlObj = new URL(imageUrl);
  const extMatch = urlObj.pathname.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1] : 'jpg'; // fallback to jpg
  const finalPath = join(process.cwd(), 'data', 'library', `${id}.${ext}`);

  updateQueueItem(id, { progress: 'Downloading image...' });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
    
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': userAgent },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(finalPath, buffer);
    
    updateQueueItem(id, { filename: `${id}.${ext}` });
    moveToLibrary(id);
  } catch (err: any) {
    console.error(`Failed to download image ${imageUrl}:`, err);
    updateQueueItem(id, { status: 'error', error: `Failed to download image: ${err.message}` });
  }
}

async function startDownload(id: string, url: string, type: string, quality: string, embedSubs: boolean, browserAuth?: string) {
  const isAudio = type === 'audio';
  let isImage = type === 'image';
  const containerExt = isAudio ? 'mp3' : isImage ? 'jpg' : 'mp4';
  const outputPath = join(process.cwd(), 'data', 'library', `${id}.%(ext)s`);
  const os = require('os');
  const platform = os.platform();
  const arch = os.arch();
  const ffmpegPath = join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg' + (platform === 'win32' ? '.exe' : ''));

  updateQueueItem(id, { status: 'downloading', progress: 'Fetching metadata...' });

  // --- Direct Image URL Special Handling ---
  if (url.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i) || url.includes('preview.redd.it') || url.includes('i.redd.it')) {
    updateQueueItem(id, { progress: 'Downloading image directly...' });
    try {
      await downloadImageUrl(id, url);
      updateQueueItem(id, {
        title: 'Direct Image Download',
        thumbnail: url,
        status: 'completed',
        progress: 'Completed'
      });
      return; // Stop execution, handled natively
    } catch (e: any) {
      updateQueueItem(id, { status: 'error', error: 'Failed to download direct image.' });
      return;
    }
  }

  const isInstagram = url.includes('instagram.com');
  // Instagram no longer supports --username/--password; use a cookies.txt file instead
  const cookiesPath = join(process.cwd(), 'data', 'instagram_cookies.txt');
  const hasCookies = require('fs').existsSync(cookiesPath);

  // --- Instagram image post special handling ---
  if (isInstagram && !isAudio) {
    let fallbackToImageScraper = false;

    try {
      const metaOptions: any = { dumpJson: true, noWarnings: true, noCheckCertificates: true };
      if (hasCookies) metaOptions.cookies = cookiesPath;
      else if (browserAuth && browserAuth !== 'none') metaOptions.cookiesFromBrowser = browserAuth;

      const info = await youtubedl(url, metaOptions) as any;

      const realTitle = info.title || info.description || info.fulltitle || 'Instagram Post';
      const realThumbnail = info.thumbnail || (info.thumbnails?.length > 0 ? info.thumbnails[0].url : undefined);
      updateQueueItem(id, {
        title: realTitle.length > 100 ? realTitle.substring(0, 100) + '...' : realTitle,
        thumbnail: realThumbnail,
        duration: String(info.duration || '')
      });

      const hasVideo = info.formats?.some((f: any) => f.vcodec && f.vcodec !== 'none' && f.vcodec !== 'mhtml');
      if (!hasVideo || isImage || type === 'image') {
        isImage = true;
        fallbackToImageScraper = true; // Use instaloader for high-res images/carousels
      }
    } catch (e: any) {
      const errMsg: string = e?.message || e?.stderr || String(e);
      // If it explicitly failed because no video, OR the user explicitly requested an image, always use our scraper
      if (errMsg.toLowerCase().includes('no video') || errMsg.toLowerCase().includes('no video in this post') || isImage || type === 'image') {
        isImage = true;
        fallbackToImageScraper = true;
      } else {
        console.warn(`Failed to fetch Instagram metadata for ${id}: ${errMsg}`);
      }
    }

    if (fallbackToImageScraper) {
      updateQueueItem(id, { progress: 'Fetching Instagram image...' });
      let imageUrl: string | null = null;

      // 1. Try Instaloader first (handles private and carousels well if cookies are present)
      try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        const shortcodeIndex = pathParts.indexOf('p') > -1 ? pathParts.indexOf('p') + 1 : pathParts.indexOf('reel') > -1 ? pathParts.indexOf('reel') + 1 : 0;
        const shortcode = pathParts[shortcodeIndex];
        
        if (shortcode) {
          const helperPath = join(process.cwd(), 'instaloader_helper.py');
          const cmd = hasCookies ? `python "${helperPath}" ${shortcode} "${cookiesPath}"` : `python "${helperPath}" ${shortcode}`;
          const { stdout } = await execAsync(cmd);
          const result = JSON.parse(stdout);
          if (result.success && result.images && result.images.length > 0) {
            imageUrl = result.images[0];
          }
        }
      } catch (e) {
        console.error("Instaloader helper failed:", e);
      }

      // 2. Fallback to /embed/ endpoint if instaloader fails (e.g. no cookies and rate limited)
      if (!imageUrl) {
        try {
          const urlObj = new URL(url);
          const embedUrl = `https://www.instagram.com${urlObj.pathname.replace(/\/$/, '')}/embed/`;
          const response = await fetch(embedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.19045; en-US) PowerShell/5.1.19045.4412' }
          });
          const pageHtml = await response.text();
          const imgMatch = pageHtml.match(/class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i) || pageHtml.match(/EmbeddedMediaImage[^>]+src="([^"]+)"/i);
          if (imgMatch) {
            imageUrl = imgMatch[1].replace(/&amp;/g, '&');
          }
        } catch (e) {}
      }

      if (imageUrl) {
        await downloadImageUrl(id, imageUrl);
      } else {
        updateQueueItem(id, { status: 'error', error: 'Could not fetch Instagram image. The post might be completely private or require login.' });
      }
      return; // Stop execution; we handled the image
    }
  } else {
    // Non-Instagram: regular metadata fetch
    try {
      const metaOptions: any = {
        dumpJson: true,
        noWarnings: true,
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
    } catch (e: any) {
      const errMsg: string = e?.message || e?.stderr || String(e);
      
      if ((url.includes('twitter.com') || url.includes('x.com')) && (errMsg.toLowerCase().includes('no video') || type === 'image')) {
        updateQueueItem(id, { progress: 'Fetching Twitter image...' });
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/');
          const statusIndex = pathParts.indexOf('status');
          if (statusIndex !== -1 && pathParts.length > statusIndex + 1) {
            const tweetId = pathParts[statusIndex + 1].split('?')[0];
            const res = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=1`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.photos && data.photos.length > 0) {
                const imageUrl = data.photos[0].url;
                await downloadImageUrl(id, imageUrl);
                updateQueueItem(id, {
                  title: data.text ? data.text.substring(0, 100) + '...' : 'Twitter Image',
                  thumbnail: imageUrl
                });
                return; // Stop execution, image downloaded successfully
              }
            }
          }
        } catch (err) {
          console.error("Twitter image fallback failed:", err);
        }
        updateQueueItem(id, { status: 'error', error: 'Could not fetch image from this Tweet.' });
        return;
      }

      if (url.includes('reddit.com') && (errMsg.toLowerCase().includes('no video') || errMsg.includes('429') || type === 'image')) {
        updateQueueItem(id, { progress: 'Fetching Reddit image...' });
        try {
          const redirectRes = await fetch(url, { method: 'HEAD' });
          const finalUrlObj = new URL(redirectRes.url);
          const embedUrl = 'https://embed.reddit.com' + finalUrlObj.pathname;
          const res = await fetch(embedUrl);
          if (res.ok) {
            const html = await res.text();
            const match = html.match(/https:\/\/(preview|i)\.redd\.it\/[a-zA-Z0-9_-]+\.(?:jpg|png|webp|gif)(?:\?[^"'\s\\]+)?/);
            if (match) {
              const imageUrl = match[0].replace(/&amp;/g, '&');
              await downloadImageUrl(id, imageUrl);
              updateQueueItem(id, {
                title: 'Reddit Image',
                thumbnail: imageUrl
              });
              return;
            }
          }
        } catch (err) {
          console.error("Reddit image fallback failed:", err);
        }
        updateQueueItem(id, { status: 'error', error: 'Could not fetch image from this Reddit post.' });
        return;
      }

      if (url.includes('facebook.com') && (errMsg.toLowerCase().includes('cannot parse data') || type === 'image')) {
        updateQueueItem(id, { progress: 'Fetching Facebook image...' });
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
          if (res.ok) {
            const html = await res.text();
            const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
            if (match) {
              const imageUrl = match[1].replace(/&amp;/g, '&');
              // Use Discordbot User-Agent because Facebook only returns raw images for social media crawlers
              await downloadImageUrl(id, imageUrl, 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)');
              updateQueueItem(id, {
                title: 'Facebook Image',
                thumbnail: imageUrl
              });
              return;
            }
          }
        } catch (err) {
          console.error("Facebook image fallback failed:", err);
        }
        updateQueueItem(id, { status: 'error', error: 'Could not fetch image from this Facebook post.' });
        return;
      }
      
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
  const ytDlpPath = require('youtube-dl-exec/src/constants').YOUTUBE_DL_PATH;
  
  const args = [
    url,
    '-o', outputPath,
    '--no-warnings',
    '--no-check-certificates',
    '--rm-cache-dir',
    '--write-info-json'
  ];

  if (fs.existsSync(ffmpegPath)) {
    args.push('--ffmpeg-location', ffmpegPath);
  };

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

      // Verify the file was actually downloaded (yt-dlp sometimes exits with 0 even on failure)
      if (isImage) {
        const imageFile = findImageFile();
        if (imageFile) {
          updateQueueItem(id, { filename: imageFile });
        } else {
          updateQueueItem(id, { status: 'error', error: 'File was not downloaded. The post might be private, require login, or contain no media.' });
          return;
        }
      } else {
        if (!fs.existsSync(finalMp4) && !fs.existsSync(finalMp3)) {
           updateQueueItem(id, { status: 'error', error: lastError || 'File was not downloaded. The post might be private, require login, or contain no media.' });
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
