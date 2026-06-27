import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await adminAuth.verifySessionCookie(session);
    const db = readDB();
    return NextResponse.json({ keys: db.accessKeys || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await adminAuth.verifySessionCookie(session);
    const { action, keyData, keyId } = await request.json();
    const db = readDB();

    if (!db.accessKeys) db.accessKeys = [];

    if (action === 'create') {
      db.accessKeys.push(keyData);
    } else if (action === 'delete') {
      db.accessKeys = db.accessKeys.filter(k => k.key !== keyId);
    } else if (action === 'update') {
      const idx = db.accessKeys.findIndex(k => k.key === keyId);
      if (idx !== -1) {
        db.accessKeys[idx] = { ...db.accessKeys[idx], ...keyData };
      }
    }

    writeDB(db);
    return NextResponse.json({ success: true, keys: db.accessKeys });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to manage keys' }, { status: 500 });
  }
}
