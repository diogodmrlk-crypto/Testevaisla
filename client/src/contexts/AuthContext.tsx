import React, { createContext, useContext, useState, useEffect } from 'react';
import { KeyData, keysDatabase } from '../data/keys';

interface SessionData {
  activeKey: string;
  keyLevel: 'BASIC' | 'PRO' | 'DEV';
  keyHwid: string;
  keyData: KeyData;
}

interface AuthContextType {
  isLoggedIn: boolean;
  session: SessionData | null;
  login: (key: string, hwid: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('authSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession(parsed);
        setIsLoggedIn(true);
      } catch {}
    }
  }, []);

  const login = async (key: string, hwid: string): Promise<{ success: boolean; message: string }> => {
    const upperKey = key.toUpperCase().trim();
    if (!upperKey) return { success: false, message: 'Por favor, insira uma key.' };

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
    return { success: true, message: 'Login realizado com sucesso!' };
  };

  const logout = () => {
    setSession(null);
    setIsLoggedIn(false);
    localStorage.removeItem('authSession');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
};
