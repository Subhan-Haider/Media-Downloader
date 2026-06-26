/**
 * Discord Webhook Notifier
 * Sends rich embed notifications to a Discord channel for all download events.
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

type DiscordColor = number;

const COLORS: Record<string, DiscordColor> = {
  queued:     0x5865F2, // Blurple
  started:    0xF59E0B, // Amber
  completed:  0x22C55E, // Green
  error:      0xEF4444, // Red
  cancelled:  0x6B7280, // Gray
  watermark:  0x8B5CF6, // Purple
};

const TYPE_ICONS: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  image: '🖼️',
};

interface NotifyOptions {
  event: 'queued' | 'started' | 'completed' | 'error' | 'cancelled' | 'watermark';
  title: string;
  url: string;
  id: string;
  type?: string;
  thumbnail?: string;
  duration?: string;
  errorMessage?: string;
  quality?: string;
}

export async function notifyDiscord(opts: NotifyOptions): Promise<void> {
  if (!WEBHOOK_URL) return; // Silently skip if not configured

  const icon = TYPE_ICONS[opts.type || 'video'] || '📥';
  const color = COLORS[opts.event] ?? COLORS.started;
  const shareLink = `https://media.subhan.tech/v/${opts.id}`;

  const eventLabels: Record<string, string> = {
    queued:     `${icon} New Download Queued`,
    started:    `${icon} Download Started`,
    completed:  `${icon} Download Completed ✅`,
    error:      `❌ Download Failed`,
    cancelled:  `🚫 Download Cancelled`,
    watermark:  `💧 Applying Watermark`,
  };

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    { name: '🔗 Source URL', value: `[Click to open](${opts.url})`, inline: false },
    { name: '🆔 File ID', value: `\`${opts.id}\``, inline: true },
  ];

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

  const embed = {
    title: eventLabels[opts.event] || 'Download Event',
    description: `**${opts.title.substring(0, 200)}**`,
    color,
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'Media Downloader • Auto Notification',
      icon_url: 'https://media.subhan.tech/logo.png',
    },
    ...(opts.thumbnail && opts.event === 'completed'
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
    // Never let a notification failure break the download pipeline
    console.warn('[Discord] Failed to send webhook notification:', err);
  }
}
