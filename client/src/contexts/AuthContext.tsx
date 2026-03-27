import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { KeyData, keysDatabase } from '../data/keys';

interface SessionData {
  activeKey: string;
  keyLevel: 'BASIC' | 'PRO' | 'DEV';
  keyHwid: string;
  keyData: KeyData;
}

export interface AlertData {
  id: string;
  to: string;
  message: string;
  sender: string;
  type: string;
  createdAt: number;
}

interface AuthContextType {
  isLoggedIn: boolean;
  session: SessionData | null;
  sessionId: string | null;
  login: (key: string, hwid: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  pendingAlerts: AlertData[];
  dismissAlert: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getOrCreateSessionId(): string {
  let id = localStorage.getItem('ferrao_session_id');
  if (!id) {
    id = 'sess-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('ferrao_session_id', id);
  }
  return id;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [sessionId] = useState<string>(() => getOrCreateSessionId());
  const [pendingAlerts, setPendingAlerts] = useState<AlertData[]>([]);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<SessionData | null>(null);
  sessionRef.current = session;

  const registerSession = useCallback(async (s: SessionData) => {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: s.activeKey,
          keyLevel: s.keyLevel,
          hwid: s.keyHwid,
          sessionId,
        }),
        signal: AbortSignal.timeout(6000),
      });
    } catch {}
  }, [sessionId]);

  const pollAlerts = useCallback(async () => {
    try {
      const res = await fetch(`/api/alerts/${sessionId}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const alerts: AlertData[] = await res.json();
        if (alerts.length > 0) {
          setPendingAlerts(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const newOnes = alerts.filter(a => !existingIds.has(a.id));
            return [...prev, ...newOnes];
          });
        }
      }
    } catch {}
  }, [sessionId]);

  const startHeartbeat = useCallback((s: SessionData) => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (alertPollRef.current) clearInterval(alertPollRef.current);

    heartbeatRef.current = setInterval(() => {
      const cur = sessionRef.current;
      if (cur) registerSession(cur);
    }, 60_000);

    alertPollRef.current = setInterval(pollAlerts, 8_000);
    pollAlerts();
  }, [registerSession, pollAlerts]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    if (alertPollRef.current) { clearInterval(alertPollRef.current); alertPollRef.current = null; }
  }, []);

  useEffect(() => {
    const savedSession = localStorage.getItem('authSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        setIsLoggedIn(true);
        registerSession(parsed).then(() => startHeartbeat(parsed));
      } catch {}
    }
    return () => stopHeartbeat();
  }, []);

  const login = async (key: string, hwid: string): Promise<{ success: boolean; message: string }> => {
    const upperKey = key.toUpperCase().trim();
    if (!upperKey) return { success: false, message: 'Por favor, insira uma key.' };

    try {
      const banRes = await fetch('/api/check-ban', { signal: AbortSignal.timeout(5000) });
      if (banRes.ok) {
        const banData = await banRes.json();
        if (banData.banned) {
          return { success: false, message: '🚫 Seu IP está banido. Contate o suporte.' };
        }
      }
    } catch {}

    const keyData = keysDatabase.keys[upperKey];
    if (!keyData) return { success: false, message: 'Key inválida ou não encontrada!' };

    const savedHwid = localStorage.getItem(`key_hwid_${upperKey}`);
    if (!savedHwid) {
      localStorage.setItem(`key_hwid_${upperKey}`, hwid);
    } else if (savedHwid !== hwid) {
      return { success: false, message: 'Key já usada em outro dispositivo (HWID).' };
    }

    const newSession: SessionData = {
      activeKey: upperKey,
      keyLevel: keyData.level,
      keyHwid: hwid,
      keyData,
    };
    setSession(newSession);
    setIsLoggedIn(true);
    localStorage.setItem('authSession', JSON.stringify(newSession));

    await registerSession(newSession);
    startHeartbeat(newSession);

    return { success: true, message: 'Login realizado com sucesso!' };
  };

  const logout = () => {
    stopHeartbeat();
    setSession(null);
    setIsLoggedIn(false);
    setPendingAlerts([]);
    localStorage.removeItem('authSession');
  };

  const dismissAlert = useCallback(async (id: string) => {
    setPendingAlerts(prev => prev.filter(a => a.id !== id));
    try {
      await fetch(`/api/alerts/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {}
  }, [sessionId]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, session, sessionId, login, logout, pendingAlerts, dismissAlert }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
