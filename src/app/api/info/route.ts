import { NextResponse } from 'next/server';
import youtubedl from 'youtube-dl-exec';
import { notifyDiscord, getIp, getCountry, getUserAgent } from '@/lib/discord';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // 🔔 Discord: URL lookup notification
  notifyDiscord({
    event: 'url_lookup',
    title: url.substring(0, 100),
    url,
    id: 'lookup',
    visitorIp: getIp(request),
    visitorCountry: getCountry(request),
    visitorDevice: getUserAgent(request),
  }).catch(() => {});

  try {
    // Check for direct image URLs (Reddit, Imgur, or direct extensions)
    if (url.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i) || url.includes('preview.redd.it') || url.includes('i.redd.it')) {
      return NextResponse.json({
        title: 'Image File',
        thumbnail: url,
        duration: null,
        formats: [{
          itag: 'direct_image',
          qualityLabel: 'Original Image',
          hasVideo: false,
          hasAudio: false,
          container: url.match(/\.png/i) ? 'png' : url.match(/\.webp/i) ? 'webp' : 'jpg',
          contentLength: 0
        }],
      });
    }

    const info = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
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

    if (url.includes('reddit.com') && (errMsg.toLowerCase().includes('no video') || errMsg.includes('429'))) {
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
            return NextResponse.json({
              title: 'Reddit Image',
              thumbnail: imageUrl,
              duration: null,
              formats: [{
                itag: 'reddit_image', // Custom itag
                qualityLabel: 'High-Res Reddit Image',
                hasVideo: false,
                hasAudio: false,
                container: imageUrl.match(/\.png/i) ? 'png' : 'jpg',
                contentLength: 0
              }],
            });
          }
        }
      } catch (e) {}
    }

    if (url.includes('facebook.com') && errMsg.toLowerCase().includes('cannot parse data')) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
        if (res.ok) {
          const html = await res.text();
          const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
          if (match) {
            const imageUrl = match[1].replace(/&amp;/g, '&');
            return NextResponse.json({
              title: 'Facebook Image',
              thumbnail: imageUrl,
              duration: null,
              formats: [{
                itag: 'facebook_image', // Custom itag
                qualityLabel: 'High-Res Facebook Image',
                hasVideo: false,
                hasAudio: false,
                container: imageUrl.match(/\.png/i) ? 'png' : 'jpg',
                contentLength: 0
              }],
            });
          }
        }
      } catch (e) {}
    }

    console.error('Error fetching video info:', error.stderr || error);
    return NextResponse.json({ error: error.stderr || error.message || String(error) }, { status: 500 });
  }
}
