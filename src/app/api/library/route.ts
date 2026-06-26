import { NextResponse } from 'next/server';
import { readDB, cleanupOldMedia } from '@/lib/db';

export async function GET() {
  cleanupOldMedia(); // Auto-delete files based on settings
  const db = readDB();
  return NextResponse.json({ library: db.library });
}

export async function DELETE() {
  const fs = require('fs');
  const path = require('path');
  const { readDB, writeDB } = require('@/lib/db');
  
  const db = readDB();
  for (const item of db.library) {
    const filePath = path.join(process.cwd(), 'data', 'library', item.filename);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch(e) {}
    }
  }
  
  db.library = [];
  writeDB(db);
  
  return NextResponse.json({ success: true });
}
