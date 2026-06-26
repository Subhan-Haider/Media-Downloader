import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificates: true,
      youtubeSkipDashManifest: true,
      flatPlaylist: true,
    } as any) as any;
    
    if (info._type === 'playlist') {
      return NextResponse.json({
        isPlaylist: true,
        title: info.title,
        entries: info.entries?.map((entry: any) => ({
          title: entry.title,
          url: entry.url,
          duration: entry.duration,
        })).filter((e: any) => e.url) || [],
      });
    }

    // Extract formats and filter
    const formats = info.formats
      ?.filter((format: any) => format.vcodec !== 'none' || format.acodec !== 'none')
      .map((format: any) => ({
        itag: format.format_id,
        qualityLabel: format.format_note || (format.height ? `${format.height}p` : 'Audio Only'),
        hasVideo: format.vcodec !== 'none',
        hasAudio: format.acodec !== 'none',
        container: format.ext,
        contentLength: format.filesize || format.filesize_approx || 0,
      })) || [];

    return NextResponse.json({
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration, // duration in seconds
      formats,
    });
  } catch (error: any) {
    const errMsg: string = error?.message || error?.stderr || String(error);
    
    if ((url.includes('twitter.com') || url.includes('x.com')) && errMsg.toLowerCase().includes('no video')) {
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
              return NextResponse.json({
                title: data.text ? data.text.substring(0, 100) + '...' : 'Twitter Image',
                thumbnail: data.photos[0].url,
                duration: null,
                formats: [{
                  itag: 'image',
                  qualityLabel: 'High-Res Image (JPG)',
                  hasVideo: false,
                  hasAudio: false,
                  container: 'jpg',
                  contentLength: 0
                }],
              });
            }
          }
        }
      } catch (e) {}
    }

    console.error('Error fetching video info:', error.stderr || error);
    return NextResponse.json({ error: error.stderr || error.message || String(error) }, { status: 500 });
  }
}
