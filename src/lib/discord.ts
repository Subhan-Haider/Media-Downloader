/**
 * Discord Webhook Notifier
 * Sends rich embed notifications to a Discord channel for all server events.
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

type DiscordColor = number;

const COLORS: Record<string, DiscordColor> = {
  queued:        0x5865F2, // Blurple
  started:       0xF59E0B, // Amber
  completed:     0x22C55E, // Green
  error:         0xEF4444, // Red
  cancelled:     0x6B7280, // Gray
  watermark:     0x8B5CF6, // Purple
  share_visit:   0x06B6D4, // Cyan
  file_download: 0xF97316, // Orange
  url_lookup:    0x3B82F6, // Blue
  file_deleted:  0xDC2626, // Dark Red
  library_view:  0x10B981, // Emerald
};

const TYPE_ICONS: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  image: '🖼️',
};

function getIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0]?.trim() || real || 'Unknown';
}

function getCountry(request: Request): string {
  return request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || '🌍';
}

function getUserAgent(request: Request): string {
  const ua = request.headers.get('user-agent') || 'Unknown';
  // Shorten UA for Discord readability
  if (ua.includes('iPhone')) return '📱 iPhone';
  if (ua.includes('Android')) return '📱 Android';
  if (ua.includes('iPad')) return '📱 iPad';
  if (ua.includes('Windows')) return '💻 Windows';
  if (ua.includes('Macintosh')) return '🍎 Mac';
  if (ua.includes('Linux')) return '🐧 Linux';
  return `🖥️ ${ua.substring(0, 40)}`;
}

export { getIp, getCountry, getUserAgent };

interface NotifyOptions {
  event:
    | 'queued' | 'started' | 'completed' | 'error' | 'cancelled' | 'watermark'
    | 'share_visit' | 'file_download' | 'url_lookup' | 'file_deleted' | 'library_view';
  title: string;
  url: string;
  id: string;
  type?: string;
  thumbnail?: string;
  duration?: string;
  errorMessage?: string;
  quality?: string;
  // Visitor fields
  visitorIp?: string;
  visitorDevice?: string;
  visitorCountry?: string;
  referer?: string;
}

export async function notifyDiscord(opts: NotifyOptions): Promise<void> {
  if (!WEBHOOK_URL) return;

  const icon = TYPE_ICONS[opts.type || 'video'] || '📥';
  const color = COLORS[opts.event] ?? 0x5865F2;
  const shareLink = `https://media.subhan.tech/v/${opts.id}`;

  const eventLabels: Record<string, string> = {
    queued:        `${icon} New Download Queued`,
    started:       `${icon} Download Started`,
    completed:     `${icon} Download Completed ✅`,
    error:         `❌ Download Failed`,
    cancelled:     `🚫 Download Cancelled`,
    watermark:     `💧 Applying Watermark`,
    share_visit:   `👁️ Share Page Visited`,
    file_download: `⬇️ File Downloaded by Visitor`,
    url_lookup:    `🔍 URL Lookup`,
    file_deleted:  `🗑️ File Deleted from Library`,
    library_view:  `📚 Library Viewed`,
  };

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  // Always show source URL for download events
  if (['queued', 'started', 'completed', 'error', 'cancelled', 'watermark', 'url_lookup'].includes(opts.event)) {
    fields.push({ name: '🔗 Source URL', value: `[Click to open](${opts.url})`, inline: false });
  }

  if (opts.id) {
    fields.push({ name: '🆔 File ID', value: `\`${opts.id}\``, inline: true });
  }
  if (opts.type) {
    fields.push({ name: '📂 Type', value: opts.type.charAt(0).toUpperCase() + opts.type.slice(1), inline: true });
  }
  if (opts.quality && opts.event === 'queued') {
    fields.push({ name: '🎚️ Quality', value: opts.quality, inline: true });
  }
  if (opts.duration && opts.event === 'completed') {
    const secs = parseInt(opts.duration, 10);
    if (!isNaN(secs)) {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      fields.push({ name: '⏱️ Duration', value: `${m}m ${s}s`, inline: true });
    }
  }
  if (opts.event === 'completed') {
    fields.push({ name: '📎 Share Link', value: `[Open in Media Server](${shareLink})`, inline: false });
  }
  if (opts.event === 'error' && opts.errorMessage) {
    fields.push({ name: '⚠️ Error Details', value: `\`\`\`${opts.errorMessage.substring(0, 512)}\`\`\``, inline: false });
  }

  // Visitor-specific fields
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

  // For share_visit and file_download events, show the share link
  if (['share_visit', 'file_download', 'file_deleted'].includes(opts.event) && opts.id) {
    fields.push({ name: '📎 Media Link', value: `[View Page](${shareLink})`, inline: true });
  }

  const embed = {
    title: eventLabels[opts.event] || 'Server Event',
    description: `**${opts.title.substring(0, 200)}**`,
    color,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Media Downloader • Auto Notification',
      icon_url: 'https://media.subhan.tech/logo.png',
    },
    ...(opts.thumbnail && ['completed', 'share_visit', 'file_download'].includes(opts.event)
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
