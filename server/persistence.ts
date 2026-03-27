import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

interface ActiveUser {
  id: string;
  key: string;
  ip: string;
  hwid: string;
  timestamp: number;
  keyLevel: 'BASIC' | 'PRO' | 'DEV';
}

interface BannedIP {
  ip: string;
  bannedAt: number;
  reason?: string;
}

interface Notification {
  id: string;
  message: string;
  sentBy: string;
  timestamp: number;
  type: 'warning' | 'info' | 'error';
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readActiveUsers(): ActiveUser[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'users_active.json');
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ users: [] }, null, 2));
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.users || [];
  } catch (error) {
    console.error('Error reading active users:', error);
    return [];
  }
}

export function writeActiveUsers(users: ActiveUser[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'users_active.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify({ users }, null, 2));
  } catch (error) {
    console.error('Error writing active users:', error);
  }
}

export function addActiveUser(user: ActiveUser): void {
  const users = readActiveUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  writeActiveUsers(users);
}

export function removeActiveUser(userId: string): void {
  const users = readActiveUsers();
  const filtered = users.filter(u => u.id !== userId);
  writeActiveUsers(filtered);
}

export function getActiveUsersByIP(ip: string): ActiveUser[] {
  const users = readActiveUsers();
  return users.filter(u => u.ip === ip);
}

export function readBannedIPs(): BannedIP[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'bans.json');
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ bannedIps: [] }, null, 2));
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.bannedIps || [];
  } catch (error) {
    console.error('Error reading banned IPs:', error);
    return [];
  }
}

export function writeBannedIPs(ips: BannedIP[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'bans.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify({ bannedIps: ips }, null, 2));
  } catch (error) {
    console.error('Error writing banned IPs:', error);
  }
}

export function addBannedIP(ip: string, reason?: string): void {
  const bans = readBannedIPs();
  const exists = bans.some(b => b.ip === ip);
  if (!exists) {
    bans.push({
      ip,
      bannedAt: Date.now(),
      reason
    });
    writeBannedIPs(bans);
  }
}

export function removeBannedIP(ip: string): void {
  const bans = readBannedIPs();
  const filtered = bans.filter(b => b.ip !== ip);
  writeBannedIPs(filtered);
}

export function isIPBanned(ip: string): boolean {
  const bans = readBannedIPs();
  return bans.some(b => b.ip === ip);
}

export function readNotifications(): Notification[] {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'notifications.json');
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({ notifications: [] }, null, 2));
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.notifications || [];
  } catch (error) {
    console.error('Error reading notifications:', error);
    return [];
  }
}

export function writeNotifications(notifications: Notification[]): void {
  ensureDataDir();
  const filePath = path.join(DATA_DIR, 'notifications.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify({ notifications }, null, 2));
  } catch (error) {
    console.error('Error writing notifications:', error);
  }
}

export function addNotification(notification: Omit<Notification, 'id'>): Notification {
  const notifications = readNotifications();
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  notifications.push(newNotification);
  writeNotifications(notifications);
  return newNotification;
}

export function getRecentNotifications(limit: number = 50): Notification[] {
  const notifications = readNotifications();
  return notifications.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export function clearOldNotifications(): void {
  const notifications = readNotifications();
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = notifications.filter(n => n.timestamp > oneDayAgo);
  writeNotifications(filtered);
}
