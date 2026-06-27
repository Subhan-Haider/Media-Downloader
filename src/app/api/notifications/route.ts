import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ preferences: db.notificationPreferences || {} });
}

export async function POST(req: Request) {
  try {
    const { event, enabled } = await req.json();
    if (typeof event !== 'string' || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const db = readDB();
    if (!db.notificationPreferences) db.notificationPreferences = {};
    db.notificationPreferences[event] = enabled;
    writeDB(db);
    return NextResponse.json({ success: true, event, enabled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
