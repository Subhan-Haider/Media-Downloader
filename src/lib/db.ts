import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface MediaItem {
  id: string; // The youtube ID or unique tempId
  title: string;
  url: string;
  filename: string; // e.g. "dQw4w9WgXcQ.mp4"
  status: 'queued' | 'downloading' | 'completed' | 'error';
  progress?: string;
  thumbnail?: string;
  duration?: string;
  error?: string;
  addedAt: number;
  isPrivate?: boolean;
  ownerKey?: string;
}

export interface Subscription {
  id: string;
  url: string;
  title: string;
  addedAt: number;
}

export interface AccessKey {
  key: string;
  name: string;
  maxGb: number;
  usedGb: number;
  ownerEmail?: string;
}

export interface UserSettings {
  email: string;
  totpSecret?: string;
  totpEnabled?: boolean;
  emailOtpCode?: string;
  emailOtpExpires?: number;
  preferred2FA?: 'totp' | 'email';
}

export interface DatabaseSchema {
  queue: MediaItem[];
  library: MediaItem[];
  subscriptions: Subscription[];
  settings: {
    autoDeleteDays: number;
    enableWatermark?: boolean;
    themeColor?: string;
    siteTitle?: string;
    siteDescription?: string;
    announcementText?: string;
    bannedIps?: string[];
    maxFileSizeMB?: number;
    sponsorHtml?: string;
    watermarkPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
    watermarkOpacity?: number;
    watermarkSize?: number;
  };
  notificationPreferences: Record<string, boolean>;
  admins: string[];
  accessKeys?: AccessKey[];
  users?: UserSettings[];
}

const defaultSchema: DatabaseSchema = {
  queue: [],
  library: [],
  subscriptions: [],
  settings: {
    autoDeleteDays: 2,
    enableWatermark: true,
    themeColor: '#0070f3',
    siteTitle: 'Media Downloader',
    siteDescription: 'Download your favorite media easily.',
    announcementText: '',
    bannedIps: [],
    maxFileSizeMB: 500,
    sponsorHtml: '',
    watermarkPosition: 'bottom-right',
    watermarkOpacity: 1.0,
    watermarkSize: 120,
  },
  notificationPreferences: {}, // empty = all enabled by default
  admins: ['setupg98@gmail.com'], // Default hardcoded admin
  accessKeys: [],
  users: [],
};

// Ensure db exists
export function initDB() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultSchema, null, 2));
  }
}

export function readDB(): DatabaseSchema {
  initDB();
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (err) {
    return defaultSchema;
  }
}

export function writeDB(data: DatabaseSchema) {
  initDB();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Helper methods

export function addToQueue(item: MediaItem) {
  const db = readDB();
  db.queue.push(item);
  writeDB(db);
}

export function updateQueueItem(id: string, updates: Partial<MediaItem>) {
  const db = readDB();
  const index = db.queue.findIndex(i => i.id === id);
  if (index !== -1) {
    db.queue[index] = { ...db.queue[index], ...updates };
    writeDB(db);
  }
}

export function moveToLibrary(id: string) {
  const db = readDB();
  const index = db.queue.findIndex(i => i.id === id);
  if (index !== -1) {
    const item = db.queue[index];
    item.status = 'completed';
    item.progress = 'Completed';
    // Add to library but leave in queue so user can manually clear it
    db.library.push(item);
    writeDB(db);
  }
}

export function clearErrorsFromQueue() {
  const db = readDB();
  db.queue = db.queue.filter(i => i.status !== 'error' && i.status !== 'completed');
  writeDB(db);
}

export function clearAllQueue() {
  const db = readDB();
  db.queue = [];
  writeDB(db);
}

export function cleanupOldMedia() {
  const db = readDB();
  const days = db.settings?.autoDeleteDays ?? 2;
  
  if (days <= 0) return; // Disabled

  const now = Date.now();
  const threshold = days * 24 * 60 * 60 * 1000;
  let changed = false;

  const filterOld = (item: MediaItem) => {
    if (now - item.addedAt > threshold) {
      if (item.filename) {
        const filePath = path.join(process.cwd(), 'data', 'library', item.filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch(e) {}
        }
      }
      changed = true;
      return false;
    }
    return true;
  };

  db.library = db.library.filter(filterOld);
  
  db.queue = db.queue.filter(item => {
    if ((item.status === 'completed' || item.status === 'error') && (now - item.addedAt > threshold)) {
      changed = true;
      return false;
    }
    return true;
  });

  if (changed) {
    writeDB(db);
  }
}

export type AdminRole = 'super' | 'full' | 'limited';

export interface AdminUser {
  email: string;
  role: AdminRole;
}

export function getAdmins(): AdminUser[] {
  const db = readDB();
  let admins = db.admins;

  if (!admins || admins.length === 0) {
    admins = [{ email: 'setupg98@gmail.com', role: 'super' }];
  } else {
    // Migration: If admins is an array of strings, convert to array of objects
    if (typeof admins[0] === 'string') {
      admins = (admins as any[]).map(email => ({
        email,
        role: email === 'setupg98@gmail.com' ? 'super' : 'full'
      }));
      setAdmins(admins);
    }
  }

  return admins;
}

export function setAdmins(admins: AdminUser[]) {
  const db = readDB();
  db.admins = admins;
  writeDB(db);
}
