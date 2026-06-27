import { NextResponse } from 'next/server';
import { readDB, cleanupOldMedia } from '@/lib/db';
import { notifyDiscord } from '@/lib/discord';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getAdmins } from '@/lib/db';

export async function GET(request: Request) {
  cleanupOldMedia();
  const db = readDB();

  const urlObj = new URL(request.url);
  const accessKey = urlObj.searchParams.get('accessKey');
  
  let isAdmin = false;
  let userEmail: string | null = null;
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (session) {
      const decodedToken = await adminAuth.verifySessionCookie(session);
      userEmail = decodedToken.email || null;
      
      const admins = getAdmins();
      if (userEmail && admins.some(a => a.email === userEmail)) {
        isAdmin = true;
      }
    }
  } catch (e) {}

  let filteredLibrary = db.library;
  if (!isAdmin && accessKey) {
    const keyObj = db.accessKeys?.find(k => k.key === accessKey);
    // Secure it: if claimed, verify the userEmail matches
    if (keyObj && keyObj.ownerEmail && keyObj.ownerEmail !== userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    filteredLibrary = db.library.filter(q => q.ownerKey === accessKey);
  }

  return NextResponse.json({ library: filteredLibrary });
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
