import { NextResponse } from 'next/server';
import { readDB, cleanupOldMedia } from '@/lib/db';
import { notifyDiscord } from '@/lib/discord';

export async function GET() {
  cleanupOldMedia();
  const db = readDB();
  return NextResponse.json({ library: db.library });
}

export async function DELETE() {
  const fs = require('fs');
  const path = require('path');
  const { readDB, writeDB } = require('@/lib/db');
  
  const db = readDB();
  const count = db.library.length;
  
  for (const item of db.library) {
    const filePath = path.join(process.cwd(), 'data', 'library', item.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch(e) {}
    }
  }
  
  db.library = [];
  writeDB(db);

  // 🔔 Discord: library cleared
  notifyDiscord({
    event: 'library_cleared',
    title: `All ${count} file${count !== 1 ? 's' : ''} permanently deleted`,
    url: '',
    id: 'library',
    fileSizeMB: 0,
  }).catch(() => {});
  
  return NextResponse.json({ success: true });
}
