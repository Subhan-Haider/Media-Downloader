import { NextResponse } from 'next/server';
import { join } from 'path';
import { stat, createReadStream } from 'fs';
import { readDB } from '@/lib/db';
import { promisify } from 'util';
import { notifyDiscord, getIp, getCountry, getUserAgent } from '@/lib/discord';

const statAsync = promisify(stat);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const db = readDB();
  const item = db.library.find(i => i.id === id);
  if (!item) {
    // 🔔 Discord: dead share link
    notifyDiscord({
      event: 'media_not_found',
      title: `File ID \`${id}\` not found`,
      url: request.url,
      id,
      visitorIp: getIp(request),
      visitorCountry: getCountry(request),
      visitorDevice: getUserAgent(request),
    }).catch(() => {});
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = join(process.cwd(), 'data', 'library', item.filename);
  
  try {
    const fileStat = await statAsync(filePath);
    const stream = createReadStream(filePath);
    
    // For video seeking to work, we need 206 Partial Content support in a real app,
    // but for simplicity we'll just stream it with length.
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on('data', chunk => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', err => controller.error(err));
      },
      cancel() {
        stream.destroy();
      }
    });

    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === 'true';
    const safeTitle = item.title.replace(/[^a-zA-Z0-9 \-_]/g, '').trim() || 'media';
    
    const fileExtension = item.filename.split('.').pop()?.toLowerCase() || 'mp4';
    const ext = `.${fileExtension}`;

    // 🔔 Discord: visitor notification
    const visitorIp = getIp(request);
    const visitorCountry = getCountry(request);
    const visitorDevice = getUserAgent(request);
    const referer = request.headers.get('referer') || undefined;
    const mediaType = ext === '.mp3' ? 'audio' : ['.jpg','.jpeg','.png','.webp','.avif','.gif'].includes(ext) ? 'image' : 'video';

    if (isDownload) {
      notifyDiscord({
        event: 'file_download',
        title: item.title,
        url: request.url,
        id: item.id,
        type: mediaType,
        thumbnail: item.thumbnail,
        visitorIp,
        visitorCountry,
        visitorDevice,
        referer,
      }).catch(() => {});
    } else {
      // Someone is streaming / playing in browser — not a save
      notifyDiscord({
        event: 'media_streamed',
        title: item.title,
        url: request.url,
        id: item.id,
        type: mediaType,
        thumbnail: item.thumbnail,
        visitorIp,
        visitorCountry,
        visitorDevice,
        referer,
      }).catch(() => {});
    }
    
    let contentType = 'video/mp4';
    if (ext === '.mp3') contentType = 'audio/mpeg';
    else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.avif') contentType = 'image/avif';

    return new NextResponse(readableStream as any, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStat.size.toString(),
        'Accept-Ranges': 'bytes',
        ...(isDownload && { 'Content-Disposition': `attachment; filename="${safeTitle}${ext}"` })
      }
    });
  } catch(e) {
    return new NextResponse('File not found on disk', { status: 404 });
  }
}

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const id = params.id;
  
  const db = readDB();
  const index = db.library.findIndex(i => i.id === id);
  if (index === -1) return new NextResponse('Not found', { status: 404 });

  const item = db.library[index];
  const filePath = join(process.cwd(), 'data', 'library', item.filename);

  // 🔔 Discord: file deleted notification
  notifyDiscord({
    event: 'file_deleted',
    title: item.title,
    url: '',
    id: item.id,
    type: item.filename.endsWith('.mp3') ? 'audio' : 'image'.match(/\.(jpg|png|webp)$/) ? 'image' : 'video',
    thumbnail: item.thumbnail,
  }).catch(() => {});

  // Remove from DB
  db.library.splice(index, 1);
  const { writeDB } = require('@/lib/db');
  writeDB(db);

  // Delete file
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch(e) {}
  }

  return NextResponse.json({ success: true });
}
