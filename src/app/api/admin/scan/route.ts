import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const db = readDB();
  const libraryDir = path.join(process.cwd(), 'data', 'library');
  
  if (!fs.existsSync(libraryDir)) {
    return NextResponse.json({ orphanedFiles: [], missingEntries: [] });
  }

  const filesOnDisk = fs.readdirSync(libraryDir);
  const dbEntries = db.library.filter(i => i.filename);
  
  // Find orphaned files (on disk, but not in DB)
  const orphanedFiles = filesOnDisk.filter(file => {
    return !dbEntries.some(entry => entry.filename === file);
  });

  // Find missing entries (in DB, but file doesn't exist)
  const missingEntries = dbEntries.filter(entry => {
    return !filesOnDisk.includes(entry.filename!);
  });

  return NextResponse.json({ orphanedFiles, missingEntries });
}

export async function POST(request: Request) {
  const { action } = await request.json(); // 'clean_orphans' or 'remove_missing'
  
  const db = readDB();
  const libraryDir = path.join(process.cwd(), 'data', 'library');
  let cleanedCount = 0;

  if (action === 'clean_orphans') {
    const filesOnDisk = fs.existsSync(libraryDir) ? fs.readdirSync(libraryDir) : [];
    const dbEntries = db.library.filter(i => i.filename);
    
    filesOnDisk.forEach(file => {
      if (!dbEntries.some(entry => entry.filename === file)) {
        try {
          fs.unlinkSync(path.join(libraryDir, file));
          cleanedCount++;
        } catch (e) {}
      }
    });
  } else if (action === 'remove_missing') {
    const filesOnDisk = fs.existsSync(libraryDir) ? fs.readdirSync(libraryDir) : [];
    const originalCount = db.library.length;
    
    db.library = db.library.filter(entry => {
      if (!entry.filename) return false; // invalid entry
      return filesOnDisk.includes(entry.filename);
    });
    
    cleanedCount = originalCount - db.library.length;
    writeDB(db);
  }

  return NextResponse.json({ success: true, cleanedCount });
}
