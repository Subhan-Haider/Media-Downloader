import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ settings: db.settings || { autoDeleteDays: 2 } });
}

export async function POST(req: Request) {
  try {
    const { settings } = await req.json();
    const db = readDB();
    
    if (!db.settings) {
      db.settings = { autoDeleteDays: 2 };
    }
    
    if (typeof settings?.autoDeleteDays === 'number') {
      db.settings.autoDeleteDays = settings.autoDeleteDays;
    }
    
    writeDB(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
