import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  
  if (!session) {
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false });
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(session);
    const isSuperAdmin = decodedToken.email === 'setupg98@gmail.com';
    return NextResponse.json({ isAdmin: true, isSuperAdmin });
  } catch (error) {
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false });
  }
}

