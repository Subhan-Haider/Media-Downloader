import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import youtubedl from 'youtube-dl-exec';
import { randomBytes } from 'crypto';
import { notifyDiscord, getIp, getCountry, getUserAgent } from '@/lib/discord';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ subscriptions: db.subscriptions });
}

export async function POST(request: Request) {
  try {
    const { action, url, id } = await request.json();
    const db = readDB();

    if (action === 'add') {
      const newSub = {
        id: randomBytes(8).toString('hex'),
        url,
        title: url,
        addedAt: Date.now()
      };
      db.subscriptions.push(newSub);
      writeDB(db);

      // 🔔 Discord: subscription added
      notifyDiscord({
        event: 'subscription_added',
        title: url,
        url,
        id: newSub.id,
        channelName: url,
        subCount: db.subscriptions.length,
        visitorIp: getIp(request),
        visitorDevice: getUserAgent(request),
        visitorCountry: getCountry(request),
      }).catch(() => {});

      return NextResponse.json({ success: true, subscription: newSub });
    }

    if (action === 'remove') {
      const sub = db.subscriptions.find(s => s.id === id);
      db.subscriptions = db.subscriptions.filter(s => s.id !== id);
      writeDB(db);

      // 🔔 Discord: subscription removed
      if (sub) {
        notifyDiscord({
          event: 'subscription_removed',
          title: sub.title || sub.url,
          url: sub.url,
          id: sub.id,
          channelName: sub.title || sub.url,
          subCount: db.subscriptions.length,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'sync') {
      const urlsToDownload: string[] = [];

      for (const sub of db.subscriptions) {
        try {
          const info = await youtubedl(sub.url, {
            dumpJson: true,
            flatPlaylist: true,
            playlistEnd: 5
          } as any) as any;

          const entries = Array.isArray(info) ? info : info.entries || [info];
          for (const entry of entries) {
            const videoUrl = entry.url || `https://www.youtube.com/watch?v=${entry.id}`;
            const inLibrary = db.library.find(i => i.url === videoUrl);
            const inQueue = db.queue.find(i => i.url === videoUrl);
            if (!inLibrary && !inQueue) {
              urlsToDownload.push(videoUrl);
            }
          }
        } catch (e) {
          console.error(`Sync failed for ${sub.url}`, e);
        }
      }

      for (const vUrl of urlsToDownload) {
        await fetch(new URL('/api/queue', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: vUrl, type: 'video', embedSubs: false })
        }).catch(console.error);
      }

      // 🔔 Discord: subscriptions synced
      notifyDiscord({
        event: 'subscriptions_synced',
        title: `Synced ${db.subscriptions.length} subscriptions`,
        url: '',
        id: 'sync',
        subCount: db.subscriptions.length,
        newVideoCount: urlsToDownload.length,
      }).catch(() => {});

      return NextResponse.json({ success: true, queuedCount: urlsToDownload.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
