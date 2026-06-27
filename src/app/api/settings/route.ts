import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { notifyDiscord } from '@/lib/discord';

export async function GET() {
  const db = readDB();
  return NextResponse.json({ settings: db.settings || { autoDeleteDays: 2, enableWatermark: true } });
}

export async function POST(req: Request) {
  try {
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
    
    writeDB(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
