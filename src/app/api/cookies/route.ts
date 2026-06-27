import { NextResponse } from 'next/server';
import fs from 'fs';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const { cookies } = await request.json();

    if (!cookies) {
      return NextResponse.json({ error: 'Missing cookies string' }, { status: 400 });
    }

    const dataDir = join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const cookiesPath = join(dataDir, 'youtube_cookies.txt');
    fs.writeFileSync(cookiesPath, cookies, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error saving cookies:', error);
    return NextResponse.json({ error: error.message || 'Failed to save cookies' }, { status: 500 });
  }
}
