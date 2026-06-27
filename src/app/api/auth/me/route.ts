import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getAdmins } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  
  if (!session) {
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false });
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(session);
    const email = decodedToken.email;
    const admins = getAdmins();
    const adminObj = admins.find(a => a.email === email);
    
    if (adminObj) {
      return NextResponse.json({ 
        isAdmin: true, 
        isSuperAdmin: adminObj.role === 'super',
        role: adminObj.role
      });
    } else {
      return NextResponse.json({ isAdmin: false, isSuperAdmin: false, role: null });
    }
  } catch (error) {
    return NextResponse.json({ isAdmin: false, isSuperAdmin: false });
  }
}

