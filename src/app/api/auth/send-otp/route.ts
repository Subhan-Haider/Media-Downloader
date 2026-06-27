import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { readDB, writeDB } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Verify the ID token and get the decoded claims
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json({ error: 'No email associated with this account' }, { status: 400 });
    }

    const db = readDB();
    let user = db.users?.find(u => u.email === email);
    
    if (!user) {
      user = { email, totpEnabled: false };
      db.users = db.users || [];
      db.users.push(user);
    }

    // Generate 6-digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.emailOtpCode = otpCode;
    user.emailOtpExpires = expires;
    writeDB(db);

    // Send email
    if (process.env.SMTP_ENABLED === 'true') {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verification Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px; color: #111827;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <h2 style="margin-top: 0; color: #4f46e5;">Authentication Required</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">
              You requested to sign in. Please use the following 6-digit verification code to complete your login.
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">
                ${otpCode}
              </span>
            </div>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
              This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"${db.settings?.siteTitle || 'Media Downloader'}" <${process.env.SMTP_FROM}>`,
        to: email,
        subject: 'Your Login Verification Code',
        text: `Your verification code is: ${otpCode}\nThis code will expire in 10 minutes.`,
        html: htmlContent,
      });
    } else {
      console.warn('SMTP is not enabled. Cannot send email. The code is:', otpCode);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });
  }
}
