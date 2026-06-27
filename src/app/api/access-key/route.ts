import { NextResponse } from 'next/server';
import { readDB, getAdmins } from '@/lib/db';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const db = readDB();
    const keyObj = db.accessKeys?.find(k => k.key === key);

    if (!keyObj) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 404 });
    }

    // Check auth
    let userEmail: string | null = null;
    let isAdmin = false;
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

    // If key is claimed, check if user matches ownerEmail or is admin
    if (keyObj.ownerEmail) {
      if (!isAdmin && keyObj.ownerEmail !== userEmail) {
        return NextResponse.json({ error: 'Unauthorized', claimed: true }, { status: 403 });
      }
    }

    return NextResponse.json({ 
      valid: true, 
      claimed: !!keyObj.ownerEmail,
      name: keyObj.name, 
      usedGb: keyObj.usedGb, 
      maxGb: keyObj.maxGb 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
