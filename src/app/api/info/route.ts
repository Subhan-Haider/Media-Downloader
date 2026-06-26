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
    console.error('Error fetching video info:', error.stderr || error);
    return NextResponse.json({ error: error.stderr || error.message || String(error) }, { status: 500 });
  }
}
