import { NextResponse } from 'next/server';
import { addToQueue, updateQueueItem, moveToLibrary, readDB, clearErrorsFromQueue, clearAllQueue, cleanupOldMedia, getAdmins } from '@/lib/db';
import { addLog } from '@/lib/logs';
import youtubedl from 'youtube-dl-exec';
import { join } from 'path';
import { randomBytes } from 'crypto';
import fs from 'fs';
import os from 'os';
import { spawn } from 'child_process';
import { notifyDiscord, getIp } from '@/lib/discord';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

const ffmpegPathGlobal = join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg' + (os.platform() === 'win32' ? '.exe' : ''));

function applyWatermarkPromise(filePath: string, id: string): Promise<void> {
  return new Promise((resolve) => {
    const db = readDB();
    if (db.settings?.enableWatermark === false) {
      return resolve();
    }

    const isVideo = filePath.endsWith('.mp4') || filePath.endsWith('.mkv') || filePath.endsWith('.webm');
    const isImage = filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png') || filePath.endsWith('.webp');
    
    if (!isVideo && !isImage) return resolve();

    const logoPath = join(process.cwd(), 'public', 'watermark.png');
    if (!fs.existsSync(logoPath) || !fs.existsSync(ffmpegPathGlobal)) return resolve();

    const position = db.settings?.watermarkPosition || 'bottom-right';
    const opacity = db.settings?.watermarkOpacity !== undefined ? db.settings.watermarkOpacity : 1.0;
    const size = db.settings?.watermarkSize || 120;

    let overlayCoord = 'W-w-(W*0.03):H-h-(H*0.03)'; // bottom-right
    if (position === 'bottom-left') overlayCoord = '(W*0.03):H-h-(H*0.03)';
    else if (position === 'top-right') overlayCoord = 'W-w-(W*0.03):(H*0.03)';
    else if (position === 'top-left') overlayCoord = '(W*0.03):(H*0.03)';
    else if (position === 'center') overlayCoord = '(W-w)/2:(H-h)/2';

    updateQueueItem(id, { progress: 'Applying Watermark (this takes time)...' });
    const ext = filePath.split('.').pop();
    const watermarkTemp = filePath.replace(`.${ext}`, `.watermark.${ext}`);

    const watermarkArgs = [
      '-i', filePath,
      '-i', logoPath,
      '-filter_complex', `[1:v][0:v]scale2ref=w='min(${size},main_w*0.2)':h='ow/a'[logo][main];[logo]format=rgba,colorchannelmixer=aa=${opacity}[logo_alpha];[main][logo_alpha]overlay=${overlayCoord}`,
      ...(isVideo ? ['-c:a', 'copy', '-c:v', 'libx264', '-preset', 'fast'] : ['-frames:v', '1', '-update', '1']),
      '-y',
      watermarkTemp
    ];

    const wmProcess = spawn(ffmpegPathGlobal, watermarkArgs, { detached: true, stdio: 'ignore' });
    
    wmProcess.on('error', (err) => {
      console.error('FFmpeg Spawn Error:', err);
      updateQueueItem(id, { progress: `Watermark Failed: ${err.message}` });
    });

    wmProcess.on('close', (wmCode: number) => {
      if (wmCode === 0 && fs.existsSync(watermarkTemp)) {
        try { 
          fs.unlinkSync(filePath); 
          fs.renameSync(watermarkTemp, filePath); 
          addLog(`Watermark applied successfully for ${id}`, 'info');
        } catch(e: any) {
          addLog(`File rename error after watermark: ${e.message}`, 'error');
        }
      } else {
        addLog(`Watermark process failed or temp file missing. Code: ${wmCode}`, 'error');
      }
      resolve();
    });
  });
}

// Map to track active download subprocesses
const activeProcesses: Record<string, ReturnType<typeof spawn>> = {};

export async function GET(request: Request) {
  cleanupOldMedia(); // Auto-delete files based on settings
  const db = readDB();
  
  const urlObj = new URL(request.url);
  const accessKey = urlObj.searchParams.get('accessKey');
  
  let isAdmin = false;
  let userEmail: string | null = null;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (session) {
      const decodedToken = await adminAuth.verifySessionCookie(session);
      userEmail = decodedToken.email || null;
      
      const admins = getAdmins();
      if (userEmail && admins.some(a => a.email === userEmail)) {
        isAdmin = true;
      }
    }
  } catch (e) {}

  let filteredQueue = db.queue;
  if (!isAdmin && accessKey) {
    const keyObj = db.accessKeys?.find(k => k.key === accessKey);
    // Secure it: if claimed, verify the userEmail matches
    if (keyObj && keyObj.ownerEmail && keyObj.ownerEmail !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    filteredQueue = db.queue.filter(q => q.ownerKey === accessKey);
  }

  return NextResponse.json({ queue: filteredQueue });
}

export async function DELETE(request: Request) {
  const urlObj = new URL(request.url);
  const id = urlObj.searchParams.get('id');
  const action = urlObj.searchParams.get('action');

  if (action === 'kill_all') {
    // Kill all active processes
    for (const pid in activeProcesses) {
      try { 
        activeProcesses[pid].kill(); 
        delete activeProcesses[pid];
      } catch (e) {}
    }
    clearAllQueue();
    addLog('Admin cleared the entire queue and killed all processes.', 'warn');
    return NextResponse.json({ success: true });
  }

  if (id) {
    const db = readDB();
    const item = db.queue.find(i => i.id === id);
    updateQueueItem(id, { status: 'error', error: 'Cancelled by user', progress: 'Cancelled' });
    
    // Kill the process if it's running
    if (activeProcesses[id]) {
      try { 
        activeProcesses[id].kill(); 
        delete activeProcesses[id];
        addLog(`Killed active download process for ${id}`, 'warn');
      } catch(e) {}
    }

    // 🔔 Discord: Cancelled notification
    notifyDiscord({ event: 'cancelled', title: item?.title || 'Unknown', url: item?.url || '', id, type: item?.filename?.endsWith('.mp3') ? 'audio' : 'video' }).catch(() => {});
    return NextResponse.json({ success: true });
  }
  
  clearErrorsFromQueue();
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, type, quality = '1080', embedSubs, browserAuth, isPrivate, accessKey } = body; // type is 'video' or 'audio'

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const db = readDB();
    
    // IP Banning Check
    const ip = getIp(request);
    if (db.settings?.bannedIps && db.settings.bannedIps.includes(ip)) {
      return NextResponse.json({ error: 'Your IP has been banned.' }, { status: 403 });
    }

    // Access Key Check
    let isAdmin = false;
    let userEmail: string | null = null;
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get('session')?.value;
      if (session) {
        const decodedToken = await adminAuth.verifySessionCookie(session);
        userEmail = decodedToken.email || null;
        const admins = getAdmins();
        if (userEmail && admins.some(a => a.email === userEmail)) {
          isAdmin = true;
        }
      }
    } catch (e) {}

    let matchedKey: string | undefined = undefined;
    if (db.accessKeys && db.accessKeys.length > 0 && !isAdmin) {
      if (!accessKey) {
        return NextResponse.json({ error: 'Access key is required' }, { status: 403 });
      }
      const keyObj = db.accessKeys.find(k => k.key === accessKey);
      if (!keyObj) {
        return NextResponse.json({ error: 'Invalid access key' }, { status: 403 });
      }
      
      if (keyObj.isActive === false) {
        return NextResponse.json({ error: 'Access key is disabled' }, { status: 403 });
      }
      
      // Verify claim
      if (keyObj.ownerEmail && keyObj.ownerEmail !== userEmail) {
        return NextResponse.json({ error: 'Unauthorized to use this space' }, { status: 403 });
      }

      if (keyObj.usedGb >= keyObj.maxGb) {
        return NextResponse.json({ error: 'Access key limit reached' }, { status: 403 });
      }
      matchedKey = accessKey;
    }

    const id = randomBytes(8).toString('hex');
    const isAudio = type === 'audio';
    const isImage = type === 'image';
    const containerExt = isAudio ? 'mp3' : isImage ? 'jpg' : 'mp4';
    
    const item = {
      id,
      url,
      title: 'Fetching metadata...',
      filename: `${id}.${containerExt}`,
      status: 'queued' as const,
      addedAt: Date.now(),
      isPrivate: !!isPrivate,
      ownerKey: matchedKey
    };
    
    addToQueue(item);

    // 🔔 Discord: Queued notification
    notifyDiscord({ event: 'queued', title: 'Fetching metadata...', url, id, type, quality }).catch(() => {});

    // 🔔 Discord: Platform-specific notifications
    const lUrl = url.toLowerCase();
    if (lUrl.includes('youtube.com') || lUrl.includes('youtu.be')) {
      notifyDiscord({ event: 'youtube_queued', title: url, url, id, type, quality }).catch(() => {});
    } else if (lUrl.includes('instagram.com')) {
      notifyDiscord({ event: 'instagram_queued', title: url, url, id, type }).catch(() => {});
    } else if (lUrl.includes('twitter.com') || lUrl.includes('x.com')) {
      notifyDiscord({ event: 'twitter_queued', title: url, url, id, type }).catch(() => {});
    } else if (lUrl.includes('reddit.com') || lUrl.includes('redd.it')) {
      notifyDiscord({ event: 'reddit_queued', title: url, url, id, type }).catch(() => {});
    } else if (lUrl.includes('soundcloud.com')) {
      notifyDiscord({ event: 'soundcloud_queued', title: url, url, id, type }).catch(() => {});
    } else if (lUrl.includes('facebook.com') || lUrl.includes('fb.watch')) {
      notifyDiscord({ event: 'facebook_queued', title: url, url, id, type }).catch(() => {});
    } else if (url.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i)) {
      notifyDiscord({ event: 'direct_image_queued', title: url, url, id, type }).catch(() => {});
    }

    // Kick off background download
    startDownload(id, url, type, quality, embedSubs, browserAuth, matchedKey, isAdmin ? null : db.settings?.maxFileSizeMB).catch(err => {
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
    
    await applyWatermarkPromise(finalPath, id);
    
    updateQueueItem(id, { filename: `${id}.${ext}` });
    moveToLibrary(id);
  } catch (err: any) {
    console.error(`Failed to download image ${imageUrl}:`, err);
    updateQueueItem(id, { status: 'error', error: `Failed to download image: ${err.message}` });
  }
}

async function startDownload(id: string, url: string, type: string, quality: string, embedSubs: boolean, browserAuth?: string, matchedKey?: string, maxFileSizeMB?: number | null) {
  let isAudio = type === 'audio';
  let isImage = type === 'image';
  let containerExt = isAudio ? 'mp3' : isImage ? 'jpg' : 'mp4';
  const outputPath = join(process.cwd(), 'data', 'library', `${id}.%(ext)s`);
  const os = require('os');
  const platform = os.platform();
  const arch = os.arch();
  const ffmpegPath = join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg' + (platform === 'win32' ? '.exe' : ''));

  updateQueueItem(id, { status: 'downloading', progress: 'Fetching metadata...' });
  // 🔔 Discord: Started notification
  notifyDiscord({ event: 'started', title: 'Fetching metadata...', url, id, type }).catch(() => {});

  // 🔔 Discord: browser auth used
  if (browserAuth && browserAuth !== 'none') {
    notifyDiscord({ event: 'browser_auth_used', title: `Auth via ${browserAuth} browser`, url, id, browserName: browserAuth }).catch(() => {});
  }

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
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  // Instagram no longer supports --username/--password; use a cookies.txt file instead
  const igCookiesPath = join(/*turbopackIgnore: true*/ process.cwd(), 'data', 'instagram_cookies.txt');
  const hasCookies = require('fs').existsSync(igCookiesPath);
  const ytCookiesPath = join(/*turbopackIgnore: true*/ process.cwd(), 'data', 'youtube_cookies.txt');
  const hasYtCookies = require('fs').existsSync(ytCookiesPath);

  // --- Instagram image post special handling ---
  if (isInstagram && !isAudio) {
    let fallbackToImageScraper = false;

    try {
      const metaOptions: any = { dumpJson: true, noWarnings: true, noCheckCertificates: true };
      if (hasCookies) metaOptions.cookies = igCookiesPath;
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
          const helperPath = join(/*turbopackIgnore: true*/ process.cwd(), 'instaloader_helper.py');
          const cmd = hasCookies ? `python "${helperPath}" ${shortcode} "${igCookiesPath}"` : `python "${helperPath}" ${shortcode}`;
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
        ignoreErrors: true,
        noCheckCertificates: true,
        extractorArgs: 'youtube:player_client=android,web',
        jsRuntimes: `node:"${process.execPath}"`
      };
      const ytCookiesPathRel = 'data/youtube_cookies.txt';

      if (browserAuth && browserAuth !== 'none') {
        metaOptions.cookiesFromBrowser = browserAuth;
      }
      let info = await youtubedl(url, metaOptions) as any;

      if (isYouTube && (!info.formats || info.formats.length === 0) && hasYtCookies) {
        metaOptions.cookies = ytCookiesPathRel;
        info = await youtubedl(url, metaOptions) as any;
      }

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

      // AUTO-DETECT AUDIO-ONLY STREAMS (e.g. SoundCloud, podcasts)
      if (!isAudio && !isImage && info.formats) {
        // If NO format has a video codec, it's strictly audio
        const hasVideo = info.formats.some((f: any) => f.vcodec !== 'none' && f.video_ext !== 'none');
        if (!hasVideo) {
          isAudio = true;
          containerExt = 'mp3';
          updateQueueItem(id, { filename: `${id}.mp3` });
          console.log(`Auto-detected audio-only stream for ${id}, switching to MP3`);
        }
      }
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

      if ((url.includes('facebook.com') || url.includes('fb.watch')) && (errMsg.toLowerCase().includes('cannot parse data') || type === 'image')) {
        updateQueueItem(id, { progress: 'Fetching Facebook image...' });
        try {
          // Fetch to resolve any redirects (like /share/ or fb.watch)
          const res = await fetch(url, { redirect: 'follow' });
          const finalUrl = res.url;
          
          let fbid = null;
          const fbidMatch = finalUrl.match(/fbid[=:](\d+)/);
          if (fbidMatch) {
            fbid = fbidMatch[1];
          } else {
            const pathMatch = finalUrl.match(/\/photos?\/(?:[^\/]+\/)*?(\d+)/);
            if (pathMatch) fbid = pathMatch[1];
          }

          if (fbid) {
            const imageUrl = `https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=${fbid}`;
            // Use Discordbot User-Agent because Facebook only returns raw images for social media crawlers
            await downloadImageUrl(id, imageUrl, 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)');
            updateQueueItem(id, {
              title: 'Facebook Image',
              thumbnail: imageUrl
            });
            return;
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
    '--write-info-json',
    '--concurrent-fragments', '5',
    '--js-runtimes', `node:${process.execPath}`
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

  // We only pass cookies if they exist. For YouTube, we prioritize fetching without cookies if possible, 
  // but during actual download we might need them if the video is age restricted.
  const ytCookiesPathRel = 'data/youtube_cookies.txt';
  const igCookiesPathRel = 'data/instagram_cookies.txt';

  if (isInstagram && hasCookies) {
    args.push('--cookies', igCookiesPathRel);
  } else if (isYouTube && hasYtCookies) {
    // If we have YouTube cookies, we pass them during download to ensure it succeeds for 18+ videos
    args.push('--cookies', ytCookiesPathRel);
  } else if (browserAuth && browserAuth !== 'none') {
    args.push('--cookies-from-browser', browserAuth);
  }

  if (maxFileSizeMB) {
    args.push('--max-filesize', `${maxFileSizeMB}m`);
  }

  const subprocess = spawn(ytDlpPath, args, {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  activeProcesses[id] = subprocess;

  subprocess.unref(); // allow the parent to exit independently

  let lastError = '';

subprocess.stderr.on('data', (data: Buffer) => {
    const text = data.toString();
    if (text.toLowerCase().includes('error')) {
      lastError = text;
    }
    // 🔔 Discord: rate limit detected
    if (text.includes('429') || text.toLowerCase().includes('rate limit') || text.toLowerCase().includes('too many requests')) {
      notifyDiscord({ event: 'rate_limit_error', title: 'Rate limit hit', url, id, errorMessage: text.substring(0, 300) }).catch(() => {});
    }
  });

  subprocess.stdout.on('data', (data: Buffer) => {
    const text = data.toString();
    const match = text.match(/\[download\]\s+([\d\.]+%) /);
    if (match) {
      updateQueueItem(id, { progress: `Downloading ${match[1]}...` });
    } else if (text.includes('Merging formats into')) {
      updateQueueItem(id, { progress: 'Merging Video & Audio...' });
      // 🔔 Discord: merging started
      notifyDiscord({ event: 'merging_started', title: 'Merging video and audio...', url, id, type: 'video' }).catch(() => {});
    } else if (text.includes('Extracting audio')) {
      updateQueueItem(id, { progress: 'Converting to MP3...' });
      // 🔔 Discord: audio conversion
      notifyDiscord({ event: 'audio_conversion', title: 'Converting to MP3...', url, id, type: 'audio' }).catch(() => {});
    } else if (text.includes('Embedding subtitles')) {
      updateQueueItem(id, { progress: 'Embedding Subtitles...' });
      // 🔔 Discord: subtitles embedded
      notifyDiscord({ event: 'subtitles_embedded', title: 'Subtitles embedded into video', url, id, type: 'video' }).catch(() => {});
    } else if (text.includes('Deleting original file')) {
      // 🔔 Discord: cleanup
      notifyDiscord({ event: 'cleanup_started', title: 'Cleaning up temporary files...', url, id }).catch(() => {});
    }
  });

  subprocess.on('close', (code: number) => {
    delete activeProcesses[id];
    // 🔔 Discord: process finished
    notifyDiscord({ event: 'process_finished', title: 'Download process finished', url, id }).catch(() => {});
    
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

    let currentTitle = 'Unknown';
    const handleSuccess = () => {
      // Parse the generated .info.json to ensure we capture the title even if the initial dumpJson failed
      const infoPath = outputPath.replace('.%(ext)s', '.info.json');
      if (fs.existsSync(infoPath)) {
        try {
          const infoData = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
          const realTitle = infoData.title || infoData.description || infoData.fulltitle || 'Unknown Video';
          currentTitle = realTitle.length > 100 ? realTitle.substring(0, 100) + '...' : realTitle;
          const realThumbnail = infoData.thumbnail || (infoData.thumbnails && infoData.thumbnails.length > 0 ? infoData.thumbnails[0].url : undefined);
          
          updateQueueItem(id, {
            title: currentTitle,
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

      const finishUp = async (filePath: string) => {
        // 🔔 Check file size for large file alert
        try {
          const stat = fs.statSync(filePath);
          const sizeMB = stat.size / (1024 * 1024);
          if (sizeMB > 100) {
            notifyDiscord({ event: 'large_file', title: currentTitle, url, id, type: isAudio ? 'audio' : isImage ? 'image' : 'video', fileSizeMB: sizeMB }).catch(() => {});
          }
        } catch (_) {}
        notifyDiscord({ event: 'watermark', title: currentTitle, url, id, type: isAudio ? 'audio' : isImage ? 'image' : 'video' }).catch(() => {});
        await applyWatermarkPromise(filePath, id);
        moveToLibrary(id);
        // 🔔 Discord: Completed notification
        const finalDb = readDB();
        const finalItem = finalDb.library.find(i => i.id === id);
        notifyDiscord({
          event: 'completed',
          title: finalItem?.title || currentTitle,
          url,
          id,
          type: isAudio ? 'audio' : isImage ? 'image' : 'video',
          thumbnail: finalItem?.thumbnail,
          duration: finalItem?.duration,
        }).catch(() => {});

        // 🔔 Update access key usedGb
        if (matchedKey) {
          try {
            const currentDb = readDB();
            if (currentDb.accessKeys) {
              const k = currentDb.accessKeys.find(x => x.key === matchedKey);
              if (k) {
                const stat = fs.statSync(filePath);
                k.usedGb += stat.size / (1024 * 1024 * 1024);
                const { writeDB } = require('@/lib/db');
                writeDB(currentDb);
              }
            }
          } catch(e) {}
        }
      };

      // Verify the file was actually downloaded
      if (isImage) {
        const imageFile = findImageFile();
        if (imageFile) {
          updateQueueItem(id, { filename: imageFile });
          finishUp(join(process.cwd(), 'data', 'library', imageFile));
        } else {
          updateQueueItem(id, { status: 'error', error: 'File was not downloaded. The post might be private, require login, or contain no media.' });
          return;
        }
      } else {
        let finalError = lastError || 'File was not downloaded. The post might be private, require login, or contain no media.';
        if (finalError.includes('Sign in to confirm your age')) {
          finalError = 'Age-restricted video. Please paste your YouTube cookies in the Settings page to authenticate.';
        }
        if (finalError.includes('File is larger than max-filesize')) {
          finalError = `File exceeds the maximum allowed size of ${maxFileSizeMB} MB for regular users.`;
        }
        if (!fs.existsSync(finalMp4) && !fs.existsSync(finalMp3)) {
           updateQueueItem(id, { status: 'error', error: finalError });
           return;
        }
        finishUp(fs.existsSync(finalMp4) ? finalMp4 : finalMp3);
      }
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
      const errMsg = lastError || `Exited with code ${code}`;
      addLog(`yt-dlp failed for ${id}: ${errMsg}`, 'error');
      updateQueueItem(id, { status: 'error', error: errMsg });
      // 🔔 Discord: Error notification
      notifyDiscord({ event: 'error', title: currentTitle, url, id, type: isAudio ? 'audio' : isImage ? 'image' : 'video', errorMessage: errMsg }).catch(() => {});
    }
  });
}
