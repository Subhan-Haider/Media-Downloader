import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getAdmins, readDB, writeDB } from '@/lib/db';
import { generateSecret, verify, generateURI } from 'otplib';
import QRCode from 'qrcode';

export async function POST(request: Request) {
  try {
    const { idToken, totpCode, authMethod } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing ID token' }, { status: 401 });
    }

    // Verify the ID token and get the decoded claims
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    
    // Check if the user is in the authorized admin list
    const admins = getAdmins();
    if (!email || !admins.some(a => a.email === email)) {
      // Unauthorize immediately if not admin
      return NextResponse.json({ error: 'Unauthorized: Only an admin can access this app' }, { status: 403 });
    }

    const db = readDB();
    let user = db.users?.find(u => u.email === email);
    
    if (!user) {
      user = { email, totpEnabled: false };
      db.users = db.users || [];
      db.users.push(user);
      writeDB(db);
    }

    // If 2FA is explicitly disabled by super admin, bypass
    if (user.totpRequired === false) {
      // Create session without 2FA
      const expiresIn = 60 * 60 * 24 * 5 * 1000;
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      const response = NextResponse.json({ success: true }, { status: 200 });
      response.cookies.set('session', sessionCookie, { maxAge: expiresIn, httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', sameSite: 'lax' });
      return response;
    }

    // If TOTP is enabled and no code provided, ask for it
    if (user.totpEnabled && !totpCode) {
      return NextResponse.json({ requiresTotp: true }, { status: 200 });
    }

    // If TOTP is NOT enabled and no code provided, generate secret and ask to setup
    if (!user.totpEnabled && !totpCode) {
      const secret = generateSecret();
      const otpauth = generateURI({ issuer: 'MediaServer', label: email, secret });
      const qrCode = await QRCode.toDataURL(otpauth);
      
      // temporarily store secret
      user.totpSecret = secret;
      writeDB(db);

      return NextResponse.json({ setupTotp: true, qrCode, secret }, { status: 200 });
    }

    // If totpCode IS provided, verify it
    if (totpCode) {
      if (authMethod === 'email') {
        if (!user.emailOtpCode || !user.emailOtpExpires) {
          return NextResponse.json({ error: 'No email code requested.' }, { status: 400 });
        }
        if (Date.now() > user.emailOtpExpires) {
          return NextResponse.json({ error: 'Email code has expired. Please request a new one.' }, { status: 400 });
        }
        if (user.emailOtpCode !== totpCode) {
          return NextResponse.json({ error: 'Invalid email code. Please try again.' }, { status: 400 });
        }
        
        // Clear the code after successful verification
        delete user.emailOtpCode;
        delete user.emailOtpExpires;
        writeDB(db);
      } else {
        const result = await verify({ token: totpCode, secret: user.totpSecret! });
        if (!result.valid) {
          return NextResponse.json({ error: 'Invalid 2FA code. Please try again.' }, { status: 400 });
        }

        // If they were setting it up via Authenticator, mark it as enabled now
        if (!user.totpEnabled) {
          user.totpEnabled = true;
          writeDB(db);
        }
      }
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
