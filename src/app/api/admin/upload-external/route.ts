import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getAdmins, readDB } from '@/lib/db';
import { notifyDiscord } from '@/lib/discord';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(session);
    const admins = getAdmins();
    const adminObj = admins.find(a => a.email === decodedToken.email);

    // Only allow SUPER ADMIN to upload to the external server
    if (!adminObj || adminObj.role !== 'super') {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
    }

    const db = readDB();
    const mediaItem = db.library?.find(item => item.id === id);

    if (!mediaItem || !mediaItem.filename) {
      return NextResponse.json({ error: 'Media item not found in library' }, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'data', 'library', mediaItem.filename);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File does not exist on disk' }, { status: 404 });
    }

    const apiKey = process.env.LOOTOPS_API_KEY || 'sh202620252009sh';
    const folder = process.env.LOOTOPS_UPLOAD_FOLDER || 'api_uploads';

    // Use curl.exe (built into Windows 10+) — most reliable multipart upload method
    // Matches the cURL example from the API docs exactly
    const { stdout, stderr } = await execFileAsync('curl', [
      '-X', 'POST',
      'https://server.lootops.me/upload',
      '-H', `x-api-key: ${apiKey}`,
      '-F', `file=@${filePath}`,
      '-F', `folder=${folder}`,
      '-s',          // silent (no progress bar)
      '--max-time', '120' // 2 min timeout for large files
    ]);

    if (stderr && !stdout) {
      console.error('curl error:', stderr);
      notifyDiscord({
        event: 'external_upload_failed',
        title: `❌ External Upload Failed`,
        url: request.url,
        id: 'error',
        errorMessage: stderr
      }).catch(() => {});
      return NextResponse.json({ error: `Upload failed: ${stderr}` }, { status: 500 });
    }

    let resData: any;
    try {
      resData = JSON.parse(stdout);
    } catch {
      console.error('curl non-JSON response:', stdout);
      return NextResponse.json({ error: `Server returned non-JSON: ${stdout}` }, { status: 500 });
    }

    if (!resData.success) {
      console.error('Upload server error:', resData);
      notifyDiscord({
        event: 'external_upload_failed',
        title: `❌ External Upload Failed`,
        url: request.url,
        id: 'error',
        errorMessage: JSON.stringify(resData)
      }).catch(() => {});
      return NextResponse.json({ error: `Server error: ${JSON.stringify(resData)}` }, { status: 500 });
    }

    const fileUrl = resData.url ? `https://server.lootops.me${resData.url}` : null;

    notifyDiscord({
      event: 'external_upload_success',
      title: `☁️ External Upload Complete — ${mediaItem.filename}`,
      url: fileUrl || request.url,
      id: id,
      thumbnail: mediaItem.thumbnail
    }).catch(() => {});

    return NextResponse.json({ success: true, fileUrl, data: resData });

  } catch (error: any) {
    console.error('External upload error:', error.message);
    
    notifyDiscord({
      event: 'external_upload_failed',
      title: `❌ External Upload Failed`,
      url: request.url,
      id: 'error',
      errorMessage: error.message
    }).catch(() => {});
    
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }
}
