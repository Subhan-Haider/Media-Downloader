import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import youtubedl from 'youtube-dl-exec';
import { randomBytes } from 'crypto';

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
        title: url, // Could be fetched via ytdl but keep simple for now
        addedAt: Date.now()
      };
      db.subscriptions.push(newSub);
      writeDB(db);
      return NextResponse.json({ success: true, subscription: newSub });
    }

    if (action === 'remove') {
      db.subscriptions = db.subscriptions.filter(s => s.id !== id);
      writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'sync') {
      // Very basic sync: fetch latest 5 videos from each sub, if not in library/queue, add to queue
      // In production, this runs via a chron job
      const urlsToDownload: string[] = [];

      for (const sub of db.subscriptions) {
        try {
          const info = await youtubedl(sub.url, {
            dumpJson: true,
            flatPlaylist: true,
            playlistEnd: 5 // Just check the 5 newest
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

      // Automatically queue them
      for (const vUrl of urlsToDownload) {
        await fetch(new URL('/api/queue', request.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: vUrl, type: 'video', embedSubs: false })
        }).catch(console.error);
      }

      return NextResponse.json({ success: true, queuedCount: urlsToDownload.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
