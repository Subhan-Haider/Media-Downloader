import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';

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
    };

    if (browserAuth && browserAuth !== 'none') {
      options.cookiesFromBrowser = browserAuth;
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
