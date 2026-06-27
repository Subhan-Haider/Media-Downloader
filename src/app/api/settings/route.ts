import { NextResponse } from 'next/server';
import { getAdmins, readDB, writeDB } from '@/lib/db';
import { notifyDiscord } from '@/lib/discord';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ 
    settings: db.settings || { autoDeleteDays: 2, enableWatermark: true },
    accessKeysRequired: db.accessKeys && db.accessKeys.length > 0
  });
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decodedToken = await adminAuth.verifySessionCookie(session);
    const admins = getAdmins();
    const callerRole = admins.find(a => a.email === decodedToken.email)?.role;

    if (callerRole !== 'super' && callerRole !== 'full') {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to change settings' }, { status: 403 });
    }

    const { settings } = await req.json();
    const db = readDB();
    
    if (!db.settings) {
      db.settings = { autoDeleteDays: 2, enableWatermark: true };
    }
    
    if (typeof settings?.autoDeleteDays === 'number') {
      const oldValue = db.settings.autoDeleteDays;
      db.settings.autoDeleteDays = settings.autoDeleteDays;

      // 🔔 Discord: settings changed
      notifyDiscord({
        event: 'settings_changed',
        title: 'Auto-delete setting updated',
        url: '',
        id: 'settings',
        settingKey: 'autoDeleteDays',
        settingValue: settings.autoDeleteDays === 0
          ? 'Never (Keep Forever)'
          : `${settings.autoDeleteDays} day${settings.autoDeleteDays !== 1 ? 's' : ''}`,
      }).catch(() => {});
    }

    if (typeof settings?.enableWatermark === 'boolean') {
      db.settings.enableWatermark = settings.enableWatermark;
      
      notifyDiscord({
        event: 'settings_changed',
        title: 'Watermark setting updated',
        url: '',
        id: 'settings',
        settingKey: 'enableWatermark',
        settingValue: settings.enableWatermark ? 'Enabled' : 'Disabled',
      }).catch(() => {});
    }

    if (settings?.themeColor !== undefined) db.settings.themeColor = settings.themeColor;
    if (settings?.siteTitle !== undefined) db.settings.siteTitle = settings.siteTitle;
    if (settings?.siteDescription !== undefined) db.settings.siteDescription = settings.siteDescription;
    if (settings?.announcementText !== undefined) db.settings.announcementText = settings.announcementText;
    
    if (settings?.bannedIps !== undefined) db.settings.bannedIps = settings.bannedIps;
    if (settings?.maxFileSizeMB !== undefined) db.settings.maxFileSizeMB = settings.maxFileSizeMB;
    if (settings?.sponsorHtml !== undefined) db.settings.sponsorHtml = settings.sponsorHtml;

    if (settings?.watermarkPosition !== undefined) db.settings.watermarkPosition = settings.watermarkPosition;
    if (settings?.watermarkOpacity !== undefined) db.settings.watermarkOpacity = settings.watermarkOpacity;
    if (settings?.watermarkSize !== undefined) db.settings.watermarkSize = settings.watermarkSize;
    
    writeDB(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
