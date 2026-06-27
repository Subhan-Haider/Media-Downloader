import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getAdmins } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 401 });
    }

    // Verify the ID token and get the decoded claims
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the user is in the authorized admin list
    const admins = getAdmins();
    if (!decodedToken.email || !admins.includes(decodedToken.email)) {
      // Unauthorize immediately if not admin
      return NextResponse.json({ error: 'Unauthorized: Only an admin can access this app' }, { status: 403 });
    }

    // Create a session cookie valid for 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true }, { status: 200 });

    // Set the cookie
    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Session creation error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
