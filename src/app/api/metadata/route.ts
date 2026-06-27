import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import { join } from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const { url, browserAuth } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const options: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      jsRuntimes: `node:"${process.execPath}"`
    };

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    const isInstagram = url.includes('instagram.com');

    if (browserAuth && browserAuth !== 'none') {
      options.cookiesFromBrowser = browserAuth;
    }
    
    // Check for explicit cookies files
    const ytCookiesPath = join(process.cwd(), 'data', 'youtube_cookies.txt');
    const igCookiesPath = join(process.cwd(), 'data', 'instagram_cookies.txt');
    
    if (isYouTube && fs.existsSync(ytCookiesPath)) {
      options.cookies = `"${ytCookiesPath}"`;
    } else if (isInstagram && fs.existsSync(igCookiesPath)) {
      options.cookies = `"${igCookiesPath}"`;
    }

    const info = await youtubedl(url, options) as any;

    if (!info.formats) {
      return NextResponse.json({ qualities: [] });
    }

    // Extract unique video heights
    const heights = new Set<number>();
    info.formats.forEach((f: any) => {
      if (f.vcodec !== 'none' && f.height) {
        heights.add(f.height);
      }
    });

    const qualities = Array.from(heights).sort((a, b) => b - a);

    const realTitle = info.title || info.description || info.fulltitle || 'Unknown Video';
    const realThumbnail = info.thumbnail || (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[0].url : undefined);

    return NextResponse.json({ 
      title: realTitle.length > 100 ? realTitle.substring(0, 100) + '...' : realTitle,
      thumbnail: realThumbnail,
      duration: info.duration,
      qualities 
    });
  } catch (error: any) {
    let errMsg = error.message || String(error);
    if (errMsg.includes('Sign in to confirm your age')) {
      errMsg = 'Age-restricted video. Please paste your YouTube cookies in the Settings page to authenticate.';
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
