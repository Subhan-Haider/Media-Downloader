import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getAdmins, setAdmins } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ admins: getAdmins() });
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decodedToken = await adminAuth.verifySessionCookie(session);
    const admins = getAdmins();
    const callerRole = admins.find(a => a.email === decodedToken.email)?.role;
    
    if (callerRole !== 'super' && callerRole !== 'full') {
      return NextResponse.json({ error: 'Forbidden: Only Super or Full Admins can modify the whitelist' }, { status: 403 });
    }

    const { action, email, role = 'limited' } = await request.json();

    if (action === 'add') {
      if (email && !admins.some(a => a.email === email)) {
        admins.push({ email: email.toLowerCase(), role });
        setAdmins(admins);
      }
    } else if (action === 'remove') {
      if (email === 'setupg98@gmail.com') {
        return NextResponse.json({ error: 'Cannot remove the Super Admin' }, { status: 400 });
      }
      
      const newAdmins = admins.filter(a => a.email !== email);
      setAdmins(newAdmins);
    }

    return NextResponse.json({ success: true, admins: getAdmins() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update whitelist' }, { status: 500 });
  }
}
