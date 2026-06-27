import { NextResponse } from 'next/server';
import { readDB, writeDB, getAdmins } from '@/lib/db';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decodedToken = await adminAuth.verifySessionCookie(session);
    const admins = getAdmins();
    const isSuperAdmin = admins.find(a => a.email === decodedToken.email)?.role === 'super';
    
    // Only super and full admins can view/manage users
    const userAdmin = admins.find(a => a.email === decodedToken.email);
    if (!userAdmin || userAdmin.role === 'limited') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const db = readDB();
    const users = db.users || [];
    
    const combinedUsers = users.map(u => {
      const adminData = admins.find(a => a.email === u.email);
      const isClaimedKey = db.accessKeys?.some(k => k.ownerEmail === u.email);
      return {
        email: u.email,
        totpEnabled: u.totpEnabled,
        totpRequired: u.totpRequired !== false,
        role: adminData ? adminData.role : (isClaimedKey ? 'regular' : 'unknown')
      };
    });

    admins.forEach(admin => {
      if (!combinedUsers.find(u => u.email === admin.email)) {
        combinedUsers.push({
          email: admin.email,
          totpEnabled: false,
          totpRequired: true,
          role: admin.role
        });
      }
    });

    return NextResponse.json({ users: combinedUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decodedToken = await adminAuth.verifySessionCookie(session);
    const admins = getAdmins();
    const userAdmin = admins.find(a => a.email === decodedToken.email);
    if (!userAdmin || userAdmin.role === 'limited') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const isSuperAdmin = userAdmin.role === 'super';

    const { action, email, newEmail } = await request.json();
    const db = readDB();
    
    if (action === 'disable_2fa') {
      const targetAdmin = admins.find(a => a.email === email);
      if (targetAdmin?.role === 'super' && !isSuperAdmin) {
         return NextResponse.json({ error: 'Cannot modify Super Admin' }, { status: 403 });
      }
      
      const user = db.users?.find(u => u.email === email);
      if (user) {
        user.totpEnabled = false;
        user.totpSecret = undefined;
        writeDB(db);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle_2fa_requirement') {
      const targetAdmin = admins.find(a => a.email === email);
      if (targetAdmin?.role === 'super' && !isSuperAdmin) {
         return NextResponse.json({ error: 'Cannot modify Super Admin' }, { status: 403 });
      }
      
      db.users = db.users || [];
      let user = db.users.find(u => u.email === email);
      if (!user) {
        user = { email, totpEnabled: false };
        db.users.push(user);
      }
      
      user.totpRequired = user.totpRequired === false ? true : false;
      writeDB(db);
      
      return NextResponse.json({ success: true });
    }
    
    if (action === 'change_email') {
      if (!newEmail || newEmail === email) return NextResponse.json({ error: 'Invalid new email' }, { status: 400 });
      
      const targetAdmin = admins.find(a => a.email === email);
      if (targetAdmin?.role === 'super' && !isSuperAdmin) {
         return NextResponse.json({ error: 'Cannot modify Super Admin' }, { status: 403 });
      }

      // Update in admins
      const adminIdx = db.admins.findIndex((a: any) => (a.email || a) === email);
      if (adminIdx !== -1) {
        if (typeof db.admins[adminIdx] === 'string') {
          db.admins[adminIdx] = newEmail;
        } else {
          db.admins[adminIdx].email = newEmail;
        }
      }

      // Update in accessKeys
      if (db.accessKeys) {
        db.accessKeys.forEach(k => {
          if (k.ownerEmail === email) {
            k.ownerEmail = newEmail;
          }
        });
      }

      // Update in users
      if (db.users) {
        const user = db.users.find(u => u.email === email);
        if (user) {
          user.email = newEmail;
        }
      }

      writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const targetAdmin = admins.find(a => a.email === email);
      if (targetAdmin?.role === 'super') {
         return NextResponse.json({ error: 'Cannot delete Super Admin' }, { status: 403 });
      }

      // Remove from users
      if (db.users) {
        db.users = db.users.filter(u => u.email !== email);
      }
      
      writeDB(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
