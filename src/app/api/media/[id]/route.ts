import { NextResponse } from 'next/server';
import { join } from 'path';
import { stat, createReadStream } from 'fs';
import { readDB } from '@/lib/db';
import { promisify } from 'util';

const statAsync = promisify(stat);

export async function GET(request: Request, context: any) {
  const params = await context.params;
  const id = params.id;
  
  const db = readDB();
  const item = db.library.find(i => i.id === id);
  if (!item) return new NextResponse('Not found', { status: 404 });

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
