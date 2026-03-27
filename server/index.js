import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const DEFAULTS = {
  'sessions.json': { sessions: [] },
  'bans.json': { bannedIps: [] },
  'alerts.json': { alerts: [] },
};

function readJSON(file) {
  const path = join(DATA_DIR, file);
  try {
    if (!existsSync(path)) {
      writeFileSync(path, JSON.stringify(DEFAULTS[file] || {}, null, 2));
      return DEFAULTS[file] || {};
    }
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return DEFAULTS[file] || {};
  }
}

function writeJSON(file, data) {
  writeFileSync(join(DATA_DIR, file), JSON.stringify(data, null, 2));
}

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

const SESSION_TTL = 5 * 60 * 1000;

function cleanSessions(data) {
  const now = Date.now();
  data.sessions = (data.sessions || []).filter(s => now - s.lastSeen < SESSION_TTL);
  return data;
}

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/api/check-ban', (req, res) => {
  const ip = getClientIP(req);
  const data = readJSON('bans.json');
  const ban = (data.bannedIps || []).find(b => b.ip === ip);
  res.json({ banned: !!ban, ban: ban || null, ip });
});

app.get('/api/sessions', (req, res) => {
  let data = readJSON('sessions.json');
  data = cleanSessions(data);
  writeJSON('sessions.json', data);
  res.json(data.sessions);
});

app.post('/api/sessions', (req, res) => {
  const { key, keyLevel, hwid, sessionId } = req.body;
  const ip = getClientIP(req);

  const bans = readJSON('bans.json');
  if ((bans.bannedIps || []).some(b => b.ip === ip)) {
    return res.status(403).json({ banned: true });
  }

  let data = readJSON('sessions.json');
  data = cleanSessions(data);

  const id = sessionId || randomUUID();
  const idx = data.sessions.findIndex(s => s.id === id);
  const session = {
    id,
    key: key || '?',
    keyLevel: keyLevel || 'BASIC',
    hwid: hwid || 'unknown',
    ip,
    loginAt: idx >= 0 ? data.sessions[idx].loginAt : Date.now(),
    lastSeen: Date.now(),
  };

  if (idx >= 0) data.sessions[idx] = session;
  else data.sessions.push(session);

  writeJSON('sessions.json', data);
  res.json({ session });
});

app.delete('/api/sessions/:id', (req, res) => {
  let data = readJSON('sessions.json');
  const session = (data.sessions || []).find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'not found' });

  const bans = readJSON('bans.json');
  if (!bans.bannedIps) bans.bannedIps = [];
  if (!bans.bannedIps.some(b => b.ip === session.ip)) {
    bans.bannedIps.push({
      ip: session.ip,
      key: session.key,
      keyLevel: session.keyLevel,
      bannedAt: Date.now(),
      reason: 'Kicked by DEV',
    });
    writeJSON('bans.json', bans);
  }

  const alertData = readJSON('alerts.json');
  if (!alertData.alerts) alertData.alerts = [];
  alertData.alerts.push({
    id: randomUUID(),
    to: req.params.id,
    message: 'Você foi removido da conta pelo DEV. Seu IP foi banido.',
    sender: 'DEV',
    type: 'kick',
    createdAt: Date.now(),
    readBy: [],
  });
  writeJSON('alerts.json', alertData);

  data.sessions = (data.sessions || []).filter(s => s.id !== req.params.id);
  writeJSON('sessions.json', data);
  res.json({ ok: true });
});

app.get('/api/bans', (req, res) => {
  const data = readJSON('bans.json');
  res.json(data.bannedIps || []);
});

app.delete('/api/bans/:ip', (req, res) => {
  const ip = decodeURIComponent(req.params.ip);
  const data = readJSON('bans.json');
  data.bannedIps = (data.bannedIps || []).filter(b => b.ip !== ip);
  writeJSON('bans.json', data);
  res.json({ ok: true });
});

app.get('/api/alerts/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const data = readJSON('alerts.json');
  const pending = (data.alerts || []).filter(
    a => (a.to === 'all' || a.to === sessionId) && !(a.readBy || []).includes(sessionId)
  );
  res.json(pending);
});

app.post('/api/alerts', (req, res) => {
  const { to, message, sender } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const data = readJSON('alerts.json');
  if (!data.alerts) data.alerts = [];

  const alert = {
    id: randomUUID(),
    to: to || 'all',
    message,
    sender: sender || 'DEV',
    type: 'warning',
    createdAt: Date.now(),
    readBy: [],
  };
  data.alerts.push(alert);
  if (data.alerts.length > 200) data.alerts = data.alerts.slice(-200);
  writeJSON('alerts.json', data);
  res.json({ ok: true, alert });
});

app.post('/api/alerts/:id/read', (req, res) => {
  const { sessionId } = req.body;
  const data = readJSON('alerts.json');
  const alert = (data.alerts || []).find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'not found' });
  if (!alert.readBy) alert.readBy = [];
  if (!alert.readBy.includes(sessionId)) alert.readBy.push(sessionId);
  writeJSON('alerts.json', data);
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }));

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[API] Servidor rodando na porta ${PORT}`);
});
