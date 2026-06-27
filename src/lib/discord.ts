/**
 * Discord Webhook Notifier
 * Sends rich embed notifications for all server events — downloads, visitors, library, subscriptions.
 */
import { readDB } from '@/lib/db';

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

const COLORS: Record<string, number> = {
  // Download lifecycle
  queued:              0x5865F2,
  started:             0xF59E0B,
  watermark:           0x8B5CF6,
  completed:           0x22C55E,
  error:               0xEF4444,
  cancelled:           0x6B7280,
  // Visitor / file access
  share_visit:         0x06B6D4,
  file_download:       0xF97316,
  media_streamed:      0x0EA5E9,
  media_not_found:     0xDC2626,
  url_lookup:          0x3B82F6,
  // Library events
  file_deleted:        0xDC2626,
  library_cleared:     0x7F1D1D,
  large_file:          0xB45309,
  // Platform detections
  youtube_queued:      0xFF0000,
  instagram_queued:    0xE1306C,
  twitter_queued:      0x1DA1F2,
  reddit_queued:       0xFF4500,
  soundcloud_queued:   0xFF5500,
  facebook_queued:     0x1877F2,
  direct_image_queued: 0x6366F1,
  // Info / processing events
  playlist_detected:   0xA855F7,
  audio_conversion:    0x14B8A6,
  subtitles_embedded:  0xF472B6,
  rate_limit_error:    0xDC2626,
  browser_auth_used:   0x78716C,
  // Subscriptions
  subscription_added:  0x22C55E,
  subscription_removed:0xEF4444,
  subscriptions_synced:0x3B82F6,
  // Settings
  settings_changed:    0x64748B,
};

const PLATFORM_ICONS: Record<string, string> = {
  youtube_queued:      '▶️ YouTube',
  instagram_queued:    '📸 Instagram',
  twitter_queued:      '🐦 Twitter/X',
  reddit_queued:       '👽 Reddit',
  soundcloud_queued:   '☁️ SoundCloud',
  facebook_queued:     '📘 Facebook',
  direct_image_queued: '🖼️ Direct Image',
};

export function getIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'Unknown';
}

export function getCountry(request: Request): string {
  return request.headers.get('cf-ipcountry')
    || request.headers.get('x-vercel-ip-country')
    || '🌍';
}

export function getUserAgent(request: Request): string {
  const ua = request.headers.get('user-agent') || 'Unknown';
  if (ua.includes('iPhone'))    return '📱 iPhone';
  if (ua.includes('Android'))   return '📱 Android';
  if (ua.includes('iPad'))      return '📱 iPad';
  if (ua.includes('Windows'))   return '💻 Windows';
  if (ua.includes('Macintosh')) return '🍎 Mac';
  if (ua.includes('Linux'))     return '🐧 Linux';
  return `🖥️ ${ua.substring(0, 40)}`;
}

interface NotifyOptions {
  event: keyof typeof COLORS;
  title: string;
  url: string;
  id: string;
  // Download metadata
  type?: string;
  thumbnail?: string;
  duration?: string;
  errorMessage?: string;
  quality?: string;
  fileSizeMB?: number;
  // Visitor info
  visitorIp?: string;
  visitorDevice?: string;
  visitorCountry?: string;
  referer?: string;
  // Subscription / playlist info
  subCount?: number;
  playlistCount?: number;
  channelName?: string;
  newVideoCount?: number;
  // Settings
  settingKey?: string;
  settingValue?: string;
  // Auth
  browserName?: string;
}

export async function notifyDiscord(opts: NotifyOptions): Promise<void> {
  if (!WEBHOOK_URL) return;

  // 🔕 Check per-event toggle — if explicitly set to false, skip
  try {
    const db = readDB();
    const prefs = db.notificationPreferences || {};
    if (prefs[opts.event] === false) return;
  } catch (_) {}

  const color = COLORS[opts.event] ?? 0x5865F2;
  const shareLink = `https://media.subhan.tech/v/${opts.id}`;

  const TYPE_ICONS: Record<string, string> = { video: '🎬', audio: '🎵', image: '🖼️' };
  const icon = TYPE_ICONS[opts.type || 'video'] || '📥';

  const EVENT_LABELS: Record<string, string> = {
    // Download lifecycle
    queued:               `${icon} New Download Queued`,
    started:              `${icon} Download Started`,
    watermark:            `💧 Applying Watermark`,
    completed:            `${icon} Download Completed ✅`,
    error:                `❌ Download Failed`,
    cancelled:            `🚫 Download Cancelled`,
    // Visitor
    share_visit:          `👁️ Share Page Visited`,
    file_download:        `⬇️ File Downloaded by Visitor`,
    media_streamed:       `▶️ Media Played in Browser`,
    media_not_found:      `🔴 Dead Share Link Visited`,
    url_lookup:           `🔍 URL Lookup`,
    // Library
    file_deleted:         `🗑️ File Deleted`,
    library_cleared:      `💣 Entire Library Cleared`,
    large_file:           `📦 Large File Downloaded`,
    // Platforms
    youtube_queued:       `▶️ YouTube Download Queued`,
    instagram_queued:     `📸 Instagram Download Queued`,
    twitter_queued:       `🐦 Twitter/X Download Queued`,
    reddit_queued:        `👽 Reddit Download Queued`,
    soundcloud_queued:    `☁️ SoundCloud Download Queued`,
    facebook_queued:      `📘 Facebook Download Queued`,
    direct_image_queued:  `🖼️ Direct Image Download Queued`,
    // Processing
    playlist_detected:    `📋 Playlist Detected`,
    audio_conversion:     `🎵 Audio Converted to MP3`,
    subtitles_embedded:   `💬 Subtitles Embedded`,
    rate_limit_error:     `🚦 Rate Limit Hit`,
    browser_auth_used:    `🍪 Browser Cookies Used for Auth`,
    // Subscriptions
    subscription_added:   `➕ Channel Subscribed`,
    subscription_removed: `➖ Channel Unsubscribed`,
    subscriptions_synced: `🔄 Subscriptions Synced`,
    // Settings
    settings_changed:     `⚙️ Settings Updated`,
  };

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  // Source URL for download/lookup events
  if (opts.url && !['share_visit','file_download','media_streamed','media_not_found','file_deleted','library_cleared','subscription_added','subscription_removed','subscriptions_synced','settings_changed'].includes(opts.event)) {
    fields.push({ name: '🔗 Source URL', value: `[Open Link](${opts.url})`, inline: false });
  }

  if (opts.id && opts.id !== 'lookup') {
    fields.push({ name: '🆔 File ID', value: `\`${opts.id}\``, inline: true });
  }
  if (opts.type) {
    fields.push({ name: '📂 Type', value: opts.type.charAt(0).toUpperCase() + opts.type.slice(1), inline: true });
  }
  if (opts.quality && opts.event === 'queued') {
    fields.push({ name: '🎚️ Quality', value: opts.quality, inline: true });
  }
  if (opts.duration) {
    const secs = parseInt(opts.duration, 10);
    if (!isNaN(secs) && secs > 0) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      fields.push({ name: '⏱️ Duration', value: h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`, inline: true });
    }
  }
  if (opts.fileSizeMB && opts.fileSizeMB > 0) {
    fields.push({ name: '📦 File Size', value: `${opts.fileSizeMB.toFixed(1)} MB`, inline: true });
  }
  if (['completed', 'share_visit', 'file_download', 'media_streamed'].includes(opts.event) && opts.id && opts.id !== 'lookup') {
    fields.push({ name: '📎 Share Link', value: `[View Media](${shareLink})`, inline: false });
  }
  if (opts.event === 'error' && opts.errorMessage) {
    fields.push({ name: '⚠️ Error', value: `\`\`\`${opts.errorMessage.substring(0, 512)}\`\`\``, inline: false });
  }
  if (opts.event === 'rate_limit_error' && opts.errorMessage) {
    fields.push({ name: '⚠️ Details', value: `\`\`\`${opts.errorMessage.substring(0, 300)}\`\`\``, inline: false });
  }
  // Playlist info
  if (opts.playlistCount !== undefined) {
    fields.push({ name: '📋 Items in Playlist', value: `${opts.playlistCount}`, inline: true });
  }
  // Subscription info
  if (opts.channelName) {
    fields.push({ name: '📡 Channel', value: opts.channelName, inline: true });
  }
  if (opts.newVideoCount !== undefined) {
    fields.push({ name: '🆕 New Videos Queued', value: `${opts.newVideoCount}`, inline: true });
  }
  if (opts.subCount !== undefined) {
    fields.push({ name: '📋 Total Subscriptions', value: `${opts.subCount}`, inline: true });
  }
  // Settings
  if (opts.settingKey) {
    fields.push({ name: '🔑 Setting', value: opts.settingKey, inline: true });
    fields.push({ name: '💾 New Value', value: String(opts.settingValue), inline: true });
  }
  // Browser auth
  if (opts.browserName) {
    fields.push({ name: '🌐 Browser', value: opts.browserName, inline: true });
  }
  // Visitor info
  if (opts.visitorIp) {
    fields.push({ name: '📡 IP Address', value: `\`${opts.visitorIp}\``, inline: true });
  }
  if (opts.visitorCountry) {
    fields.push({ name: '🌍 Country', value: opts.visitorCountry, inline: true });
  }
  if (opts.visitorDevice) {
    fields.push({ name: '📟 Device', value: opts.visitorDevice, inline: true });
  }
  if (opts.referer) {
    fields.push({ name: '🔙 Referer', value: opts.referer.substring(0, 100), inline: false });
  }

  const embed = {
    title: EVENT_LABELS[opts.event] || 'Server Event',
    description: `**${opts.title.substring(0, 200)}**`,
    color,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Media Downloader • Auto Notification',
      icon_url: 'https://media.subhan.tech/logo.png',
    },
    ...(opts.thumbnail && ['completed', 'share_visit', 'file_download', 'media_streamed', 'playlist_detected'].includes(opts.event)
      ? { thumbnail: { url: opts.thumbnail } }
      : {}),
  };

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (err) {
    console.warn('[Discord] Failed to send webhook notification:', err);
  }
}
