import { NextResponse } from 'next/server';
import { tmpdir } from 'os';
import { join } from 'path';
import { readFile } from 'fs/promises';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
  }

  try {
    const progressPath = join(tmpdir(), `${id}.json`);
    const data = await readFile(progressPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error: any) {
    // If the file doesn't exist yet, it just means yt-dlp hasn't written progress yet.
    if (error.code === 'ENOENT') {
      return NextResponse.json({ progress: 'Starting...' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
