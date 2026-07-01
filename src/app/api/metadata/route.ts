import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import { join } from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  const { url, browserAuth } = await request.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {

    const options: any = {
      dumpSingleJson: true,
      noWarnings: true,
      ignoreErrors: true,
      noCheckCertificates: true,
      format: 'all',
      jsRuntimes: `node:"${process.execPath}"`
    };

    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    const isInstagram = url.includes('instagram.com');

    if (browserAuth && browserAuth !== 'none') {
      options.cookiesFromBrowser = browserAuth;
    }
    
    // Check for explicit cookies files using absolute paths for fs.existsSync
    const ytCookiesPathAbs = join(/*turbopackIgnore: true*/ process.cwd(), 'data', 'youtube_cookies.txt');
    const igCookiesPathAbs = join(/*turbopackIgnore: true*/ process.cwd(), 'data', 'instagram_cookies.txt');
    
    const ytCookiesPathRel = 'data/youtube_cookies.txt';
    const igCookiesPathRel = 'data/instagram_cookies.txt';

    if (isInstagram && fs.existsSync(igCookiesPathAbs)) {
      options.cookies = igCookiesPathRel;
    }

    let info = await youtubedl(url, options) as any;

    // Retry with YouTube cookies if formats are missing (e.g. age-restricted video)
    if (isYouTube && (!info.formats || info.formats.length === 0) && fs.existsSync(ytCookiesPathAbs)) {
      options.cookies = ytCookiesPathRel;
      info = await youtubedl(url, options) as any;
    }

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
    
    // Fallback for Instagram images (yt-dlp fails with "No video formats found")
    if (url.includes('instagram.com')) {
      try {
        const urlObj = new URL(url);
        const embedUrl = `https://www.instagram.com${urlObj.pathname.replace(/\/$/, '')}/embed/`;
        console.log("Fallback fetching: ", embedUrl);
        const response = await fetch(embedUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Microsoft Windows 10.0.19045; en-US) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const pageHtml = await response.text();
        const imgMatch = pageHtml.match(/class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i) || pageHtml.match(/EmbeddedMediaImage[^>]+src="([^"]+)"/i);
        
        if (imgMatch) {
          const thumbnail = imgMatch[1].replace(/&amp;/g, '&');
          console.log("Fallback success: ", thumbnail.substring(0, 30));
          return NextResponse.json({ 
            title: 'Instagram Post',
            thumbnail: thumbnail,
            duration: '',
            qualities: [] 
          });
        } else {
          console.log("Fallback failed: no image match found in HTML");
        }
      } catch (e) {
        console.error("Fallback error: ", e);
      }
    }

    if (errMsg.includes('Sign in to confirm your age')) {
      errMsg = 'Age-restricted video. Please paste your YouTube cookies in the Settings page to authenticate.';
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
