export interface KeyData {
  hwid: string | null;
  level: 'BASIC' | 'PRO' | 'DEV';
  expiresAt: string | null;
  durationDays: number;
  limit: number;
  packages: number;
}

export interface KeysDatabase {
  keys: Record<string, KeyData>;
}

export const keysDatabase: KeysDatabase = {
  keys: {
    // BASIC KEYS (500 limit, 20 days)
    'FERRAOBASIC1': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC2': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC3': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC4': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC5': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC6': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC7': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC8': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC9': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC10': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC11': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC12': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC13': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC14': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC15': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC16': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC17': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC18': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC19': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },
    'FERRAOBASIC20': { hwid: null, level: 'BASIC', expiresAt: null, durationDays: 20, limit: 500, packages: 0 },

    // PRO KEYS (1000 limit, 30 days)
    'FERRAOPRO1': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO2': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO3': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO4': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO5': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO6': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO7': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO8': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO9': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO10': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO11': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO12': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO13': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO14': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO15': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO16': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO17': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO18': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO19': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },
    'FERRAOPRO20': { hwid: null, level: 'PRO', expiresAt: null, durationDays: 30, limit: 1000, packages: 999 },

    // DEV KEY (5000 limit, unlimited)
    'FERRAODEV': { hwid: null, level: 'DEV', expiresAt: null, durationDays: -1, limit: 5000, packages: 999 },
  },
};
