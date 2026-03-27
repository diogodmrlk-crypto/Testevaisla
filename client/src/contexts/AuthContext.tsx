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
  sessionId: string;
  login: (key: string, hwid: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  pendingAlerts: AlertData[];
  dismissAlert: (id: string) => void;
  forceRefreshSession: () => void;
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

async function safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return null;
  }
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
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  const registerSession = useCallback(async (s: SessionData) => {
    const res = await safeFetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: s.activeKey,
        keyLevel: s.keyLevel,
        hwid: s.keyHwid,
        sessionId: sessionIdRef.current,
      }),
    });
    if (!res) console.warn('[Auth] registerSession falhou - sem resposta');
    else if (!res.ok) console.warn('[Auth] registerSession erro', res.status);
  }, []);

  const pollAlerts = useCallback(async () => {
    const res = await safeFetch(`/api/alerts/${sessionIdRef.current}`);
    if (res && res.ok) {
      const alerts: AlertData[] = await res.json();
      if (alerts.length > 0) {
        setPendingAlerts(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const newOnes = alerts.filter(a => !existingIds.has(a.id));
          return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
        });
      }
    }
  }, []);

  const startHeartbeat = useCallback((s: SessionData) => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    if (alertPollRef.current) clearInterval(alertPollRef.current);

    heartbeatRef.current = setInterval(() => {
      const cur = sessionRef.current;
      if (cur) registerSession(cur);
    }, 30_000);

    alertPollRef.current = setInterval(pollAlerts, 8_000);
    pollAlerts();
  }, [registerSession, pollAlerts]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    if (alertPollRef.current) { clearInterval(alertPollRef.current); alertPollRef.current = null; }
  }, []);

  const forceRefreshSession = useCallback(() => {
    const cur = sessionRef.current;
    if (cur) registerSession(cur);
  }, [registerSession]);

  useEffect(() => {
    const savedSession = localStorage.getItem('authSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as SessionData;
        setSession(parsed);
        setIsLoggedIn(true);
        registerSession(parsed).then(() => startHeartbeat(parsed));
      } catch {
        localStorage.removeItem('authSession');
      }
    }
    return stopHeartbeat;
  }, []);

  const login = async (key: string, hwid: string): Promise<{ success: boolean; message: string }> => {
    const upperKey = key.toUpperCase().trim();
    if (!upperKey) return { success: false, message: 'Por favor, insira uma key.' };

    const banRes = await safeFetch('/api/check-ban');
    if (banRes && banRes.ok) {
      const banData = await banRes.json();
      if (banData.banned) return { success: false, message: '🚫 Seu IP está banido. Contate o suporte.' };
    }

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
    await safeFetch(`/api/alerts/${id}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    });
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, session, sessionId, login, logout, pendingAlerts, dismissAlert, forceRefreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
