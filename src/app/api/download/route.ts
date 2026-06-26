import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import ffmpegStatic from 'ffmpeg-static';
import { tmpdir } from 'os';
import { join } from 'path';
import { createReadStream } from 'fs';
import { stat, unlink } from 'fs/promises';
import { randomBytes } from 'crypto';
import ytdlCore from '@distube/ytdl-core';
import { spawn } from 'child_process';

export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const itag = searchParams.get('itag');
  const title = searchParams.get('title') || 'video';
  const mergeAudio = searchParams.get('mergeAudio') === 'true';
  const extractAudio = searchParams.get('extractAudio') === 'true';
  const embedSubs = searchParams.get('embedSubs') === 'true';
  const id = searchParams.get('id');

  if (!url || !itag) {
    return NextResponse.json({ error: 'Invalid URL or missing format parameter' }, { status: 400 });
  }

  const safeTitle = encodeURIComponent(title.replace(/[/\\?%*:|"<>]/g, '-'));

  try {
    if (itag === 'direct_image' || url.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i) || url.includes('preview.redd.it') || url.includes('i.redd.it')) {
      const imageRes = await fetch(url);
      if (imageRes.ok && imageRes.body) {
        const ext = url.match(/\.png/i) ? 'png' : url.match(/\.webp/i) ? 'webp' : 'jpg';
        const headers = new Headers(imageRes.headers);
        headers.set('Content-Disposition', `attachment; filename="${safeTitle}.${ext}"`);
        return new NextResponse(imageRes.body as any, { headers });
      }
      throw new Error('Failed to download direct image');
    }

    if (itag === 'image' && (url.includes('twitter.com') || url.includes('x.com'))) {
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
            const imageRes = await fetch(imageUrl);
            if (imageRes.ok && imageRes.body) {
              const headers = new Headers(imageRes.headers);
              headers.set('Content-Disposition', `attachment; filename="${safeTitle}.jpg"`);
              return new NextResponse(imageRes.body as any, { headers });
            }
          }
        }
      }
      throw new Error('Failed to fetch Twitter image');
    }

    // If itag is 'best', mergeAudio is true, or extractAudio is true, we use temp file
    if (itag === 'best' || mergeAudio || extractAudio) {
      const tempId = id || randomBytes(16).toString('hex');
      const containerExt = extractAudio ? 'mp3' : (searchParams.get('ext') || 'mp4');
      const tempPath = join(tmpdir(), `${tempId}.${containerExt}`);
      const progressPath = join(tmpdir(), `${tempId}.json`);
      
      console.log(`Downloading best quality to ${tempPath}...`);
      
      const formatString = extractAudio 
        ? 'bestaudio'
        : itag === 'best' 
          ? 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best'
          : `${itag}+bestaudio[ext=m4a]/${itag}`;

      const ffmpegPath = require('ffmpeg-static');

      const options: any = {
        f: formatString,
        o: tempPath.replace(`.${containerExt}`, '.%(ext)s'),
        ffmpegLocation: ffmpegPath,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificates: true,
      };

      if (extractAudio) {
        options.extractAudio = true;
        options.audioFormat = 'mp3';
      } else {
        options.mergeOutputFormat = containerExt;
      }

      if (embedSubs) {
        options.writeAutoSubs = true;
        options.embedSubs = true;
      }

      // Download and merge to temp file
      const subprocess = youtubedl.exec(url, options);

      // Track progress
      if (subprocess.stdout) {
        subprocess.stdout.on('data', (data: Buffer) => {
          const text = data.toString();
          const match = text.match(/\[download\]\s+([\d\.]+%) /);
          if (match) {
            require('fs').writeFileSync(progressPath, JSON.stringify({ progress: `Downloading ${match[1]}...` }));
          } else if (text.includes('Merging formats into')) {
            require('fs').writeFileSync(progressPath, JSON.stringify({ progress: 'Merging Video & Audio...' }));
          } else if (text.includes('Extracting audio')) {
            require('fs').writeFileSync(progressPath, JSON.stringify({ progress: 'Converting to MP3...' }));
          } else if (text.includes('Embedding subtitles')) {
            require('fs').writeFileSync(progressPath, JSON.stringify({ progress: 'Embedding Subtitles...' }));
          }
        });
      }

      try {
        await subprocess;
      } catch (err: any) {
        console.error('yt-dlp execution failed:', err);
        require('fs').writeFileSync(progressPath, JSON.stringify({ error: err.message || 'Download failed' }));
        throw err;
      }

      console.log(`Download complete! Streaming ${tempPath}...`);
      const fileStats = await stat(tempPath);
      const fileStream = createReadStream(tempPath);
      
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => {
            controller.close();
            unlink(tempPath).catch(console.error); // cleanup
          });
          fileStream.on('error', (err) => {
            controller.error(err);
            unlink(tempPath).catch(console.error);
          });
        },
        cancel() {
          fileStream.destroy();
          unlink(tempPath).catch(console.error);
        }
      });

      return new NextResponse(readableStream as any, {
        headers: {
          'Content-Disposition': `attachment; filename="${safeTitle}.${containerExt}"`,
          'Content-Type': `video/${containerExt}`,
          'Content-Length': fileStats.size.toString(),
        },
      });
    }

    // Original streaming logic for single formats
    const subprocess = youtubedl.exec(url, {
      f: itag,
      o: '-', // output to stdout
      noWarnings: true,
      noCallHome: true,
      noCheckCertificates: true,
    } as any);
    
    // Convert Node.js readable stream to Web API ReadableStream
    const readableStream = new ReadableStream({
      start(controller) {
        if (subprocess.stdout) {
          subprocess.stdout.on('data', (chunk) => controller.enqueue(chunk));
          subprocess.stdout.on('end', () => controller.close());
          subprocess.stdout.on('error', (err) => controller.error(err));
        } else {
          controller.error(new Error('Failed to get stdout from youtube-dl'));
        }
      },
      cancel() {
        subprocess.kill('SIGKILL');
      }
    });

    const container = searchParams.get('ext') || 'mp4';
    const filename = `${safeTitle}.${container}`;

    return new NextResponse(readableStream as any, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': 'application/octet-stream', // Generic fallback
      },
    });

  } catch (error: any) {
    console.error('Error in download route:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}

