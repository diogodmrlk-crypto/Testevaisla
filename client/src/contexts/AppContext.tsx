import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface KeyData {
  id: string;
  key: string;
  type: string;
  expire: number;
  used: boolean;
  device: string;
  createdAt: number;
  activatedAt: number;
  expiresAt: number;
  _pkg?: string;
  _pkgId?: string;
  ip?: string;
  version?: string;
}

export interface Package {
  id: string;
  name: string;
  url: string;
  desc: string;
  enabled: boolean;
  sent: number;
}

type Page = 'home' | 'keys' | 'devices' | 'packages' | 'profile';
type Modal = 'create' | 'pkg' | 'integration' | 'device-action' | 'lang' | 'support' | null;

const STORAGE = {
  keys: 'ferrao_keys',
  packages: 'ferrao_packages',
  limit: 'ferrao_limit',
  chartData: 'ferrao_chart',
  apiKeys: 'ferrao_api_keys',
  deleted: 'ferrao_deleted',
};

function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
function load<T>(k: string, def: T): T {
  try {
    const v = localStorage.getItem(k);
    return v !== null ? JSON.parse(v) : def;
  } catch { return def; }
}

const API_URL = 'https://teste-api-mcok.vercel.app/keys';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1446276085397590018/Uwj0sKu8SKD4ZqVtnkdz4nhfEd_DlKE_AdeEde3EX9NglfGPhuTz9pXLPSiROrBNmhXy';

interface AppContextType {
  currentPage: Page;
  navigate: (page: Page) => void;
  openModal: Modal;
  showModal: (m: Modal) => void;
  closeModal: () => void;
  generatedKeys: KeyData[];
  apiKeys: KeyData[];
  packages: Package[];
  limitCount: number;
  keyLimit: number;
  chartData: Record<string, number>;
  selectedIds: Set<string>;
  activeDeviceKey: KeyData | null;
  toast: string;
  showToast: (msg: string) => void;
  getMergedKeys: () => KeyData[];
  createKeys: (qty: number, type: string, dur: number, pkgId: string) => Promise<void>;
  deleteSelected: () => Promise<void>;
  toggleSelect: (id: string) => void;
  fetchRemoteKeys: () => Promise<void>;
  addPackage: (name: string, url: string, desc: string) => void;
  togglePkg: (i: number) => void;
  deletePkg: (i: number) => void;
  resetAllKeys: () => void;
  doDeviceAction: (action: 'reset' | 'revoke') => Promise<void>;
  openDeviceActionModal: (keyId: string) => void;
  setActiveDeviceKey: (k: KeyData | null) => void;
  lang: string;
  setLang: (l: string) => void;
  sendSupportTicket: (name: string, problem: string, desc: string) => Promise<void>;
  copyText: (text: string, msg?: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearSessions: () => void;
  deletedIds: Set<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode; keyLimit: number }> = ({ children, keyLimit }) => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [openModal, setOpenModal] = useState<Modal>(null);
  const [generatedKeys, setGeneratedKeys] = useState<KeyData[]>(() => load(STORAGE.keys, []));
  const [apiKeys, setApiKeys] = useState<KeyData[]>(() => load(STORAGE.apiKeys, []));
  const [packages, setPackages] = useState<Package[]>(() =>
    load(STORAGE.packages, [{ id: 'default', name: 'API', url: API_URL, desc: 'API principal FERRAO', enabled: true, sent: 0 }])
  );
  const [limitCount, setLimitCount] = useState<number>(() => load(STORAGE.limit, 0));
  const [chartData, setChartData] = useState<Record<string, number>>(() => load(STORAGE.chartData, {}));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set(load(STORAGE.deleted, [])));
  const [activeDeviceKey, setActiveDeviceKey] = useState<KeyData | null>(null);
  const [toast, setToast] = useState('');
  const [lang, setLangState] = useState(() => localStorage.getItem('ferrao_lang') || 'pt');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 3400);
  }, []);

  const navigate = useCallback((page: Page) => {
    setCurrentPage(page);
  }, []);

  const showModal = useCallback((m: Modal) => setOpenModal(m), []);
  const closeModal = useCallback(() => setOpenModal(null), []);

  const getMergedKeys = useCallback((): KeyData[] => {
    const all = [...generatedKeys, ...apiKeys];
    const seen = new Set<string>();
    return all
      .filter(k => {
        if (seen.has(k.id) || deletedIds.has(k.id)) return false;
        seen.add(k.id);
        return true;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [generatedKeys, apiKeys, deletedIds]);

  const copyText = useCallback(async (text: string, msg = 'Copiado!') => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    showToast('📋 ' + msg);
  }, [showToast]);

  const fetchRemoteKeys = useCallback(async () => {
    try {
      const res = await fetch(API_URL, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        const fetched: KeyData[] = data.map((k: KeyData) => ({ ...k, id: k.id?.toString() || 'api-' + Math.random() }));
        setApiKeys(fetched);
        save(STORAGE.apiKeys, fetched);
      }
    } catch { /* API offline, use cache */ }
  }, []);

  const generateKeyString = (type: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    return `GHOST-${type}-${rand}${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;
  };

  const sendKeyToApi = async (pkgUrl: string, keyData: KeyData) => {
    try {
      const res = await fetch(pkgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyData),
        signal: AbortSignal.timeout(8000),
      });
      return res.ok;
    } catch { return false; }
  };

  const createKeys = useCallback(async (qty: number, type: string, dur: number, pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) { showToast('⚠️ Package não encontrado'); return; }
    if (limitCount >= keyLimit) { showToast('❌ Limite de ' + keyLimit + ' atingido'); return; }
    const realQty = Math.min(qty, keyLimit - limitCount);
    const today = new Date().toISOString().slice(0, 10);
    const newKeys: KeyData[] = [];
    const sentOk: boolean[] = [];
    for (let i = 0; i < realQty; i++) {
      const key = generateKeyString(type);
      const keyObj: KeyData = {
        id: 'local-' + Date.now() + '-' + i,
        key,
        type,
        expire: dur,
        used: false,
        device: '',
        createdAt: Math.floor(Date.now() / 1000),
        activatedAt: 0,
        expiresAt: 0,
        _pkg: pkg.name,
        _pkgId: pkgId,
      };
      newKeys.push(keyObj);
      sentOk.push(await sendKeyToApi(pkg.url, keyObj));
    }
    setGeneratedKeys(prev => {
      const updated = [...newKeys, ...prev];
      save(STORAGE.keys, updated);
      return updated;
    });
    const newLimit = Math.min(limitCount + realQty, keyLimit);
    setLimitCount(newLimit);
    save(STORAGE.limit, newLimit);
    setChartData(prev => {
      const updated = { ...prev, [today]: (prev[today] || 0) + realQty };
      save(STORAGE.chartData, updated);
      return updated;
    });
    setPackages(prev => {
      const updated = prev.map(p => p.id === pkgId ? { ...p, sent: (p.sent || 0) + realQty } : p);
      save(STORAGE.packages, updated);
      return updated;
    });
    const okCount = sentOk.filter(Boolean).length;
    showToast(`✅ ${realQty} key(s)! ${okCount === realQty ? '📡 Enviadas!' : okCount > 0 ? `⚠️ ${okCount}/${realQty}` : '💾 Local'}`);
    return newKeys as unknown as void;
  }, [packages, limitCount, keyLimit, showToast]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const deleteSelected = useCallback(async () => {
    if (!selectedIds.size) { showToast('⚠️ Selecione keys primeiro'); return; }
    const n = selectedIds.size;
    showToast(`⏳ Excluindo ${n} key(s)...`);
    const toDelete = getMergedKeys().filter(k => selectedIds.has(k.id));
    setDeletedIds(prev => {
      const next = new Set(prev);
      selectedIds.forEach(id => next.add(id));
      save(STORAGE.deleted, [...next]);
      return next;
    });
    setGeneratedKeys(prev => { const u = prev.filter(k => !selectedIds.has(k.id)); save(STORAGE.keys, u); return u; });
    setApiKeys(prev => { const u = prev.filter(k => !selectedIds.has(k.id)); save(STORAGE.apiKeys, u); return u; });
    setSelectedIds(new Set());
    let apiDeletedCount = 0;
    for (const k of toDelete) {
      try {
        const res = await fetch(`${API_URL}/${k.id}`, { method: 'DELETE', signal: AbortSignal.timeout(6000) });
        if (res.ok) apiDeletedCount++;
      } catch {}
    }
    showToast(`🗑️ ${n} key(s) removida(s)${apiDeletedCount > 0 ? ` (${apiDeletedCount} da API)` : ''}`);
  }, [selectedIds, getMergedKeys, showToast]);

  const addPackage = useCallback((name: string, url: string, desc: string) => {
    const newPkg: Package = { id: 'pkg-' + Date.now(), name, url, desc, enabled: true, sent: 0 };
    setPackages(prev => { const u = [...prev, newPkg]; save(STORAGE.packages, u); return u; });
    showToast(`📦 Package "${name}" adicionado!`);
  }, [showToast]);

  const togglePkg = useCallback((i: number) => {
    setPackages(prev => {
      const u = prev.map((p, idx) => idx === i ? { ...p, enabled: !p.enabled } : p);
      save(STORAGE.packages, u);
      return u;
    });
  }, []);

  const deletePkg = useCallback((i: number) => {
    setPackages(prev => {
      const name = prev[i].name;
      const u = prev.filter((_, idx) => idx !== i);
      save(STORAGE.packages, u);
      showToast(`📦 Package "${name}" removido`);
      return u;
    });
  }, [showToast]);

  const resetAllKeys = useCallback(() => {
    if (!confirm('Limpar TODAS as keys?')) return;
    setGeneratedKeys([]); setApiKeys([]); setLimitCount(0); setChartData({}); setDeletedIds(new Set()); setSelectedIds(new Set());
    save(STORAGE.keys, []); save(STORAGE.apiKeys, []); save(STORAGE.limit, 0); save(STORAGE.chartData, {}); save(STORAGE.deleted, []);
    showToast('🗑️ Todas as keys limpas');
  }, [showToast]);

  const openDeviceActionModal = useCallback((keyId: string) => {
    const k = getMergedKeys().find(k => k.id === keyId);
    if (!k) return;
    setActiveDeviceKey(k);
    setOpenModal('device-action');
  }, [getMergedKeys]);

  const doDeviceAction = useCallback(async (action: 'reset' | 'revoke') => {
    if (!activeDeviceKey) return;
    const k = activeDeviceKey;
    setOpenModal(null);
    if (action === 'reset') {
      showToast('⏳ Resetando device...');
      const upd = (arr: KeyData[]) => arr.map(i => i.id === k.id ? { ...i, used: false, device: '', activatedAt: 0, expiresAt: 0 } : i);
      setGeneratedKeys(prev => { const u = upd(prev); save(STORAGE.keys, u); return u; });
      setApiKeys(prev => { const u = upd(prev); save(STORAGE.apiKeys, u); return u; });
      try {
        await fetch(`${API_URL}/${k.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ used: false, device: '', activatedAt: 0, expiresAt: 0 }),
          signal: AbortSignal.timeout(6000),
        });
      } catch {}
      showToast('✅ Device resetado! Key disponível.');
    } else {
      showToast('⏳ Revogando device...');
      setDeletedIds(prev => { const next = new Set(prev); next.add(k.id); save(STORAGE.deleted, [...next]); return next; });
      setGeneratedKeys(prev => { const u = prev.filter(i => i.id !== k.id); save(STORAGE.keys, u); return u; });
      setApiKeys(prev => { const u = prev.filter(i => i.id !== k.id); save(STORAGE.apiKeys, u); return u; });
      try { await fetch(`${API_URL}/${k.id}`, { method: 'DELETE', signal: AbortSignal.timeout(6000) }); } catch {}
      showToast('🚫 Device revogado e key excluída.');
    }
    setActiveDeviceKey(null);
  }, [activeDeviceKey, showToast]);

  const setLang = useCallback((l: string) => {
    setLangState(l);
    localStorage.setItem('ferrao_lang', l);
    showToast('🌐 Language changed!');
  }, [showToast]);

  const sendSupportTicket = useCallback(async (name: string, problem: string, desc: string) => {
    const embed = {
      title: '🎫 Novo Ticket de Suporte',
      color: 0x1a56e8,
      fields: [
        { name: '👤 Nome', value: name, inline: true },
        { name: '🔴 Problema', value: problem, inline: true },
        { name: '📝 Descrição', value: desc, inline: false },
      ],
    };
    try {
      const res = await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
      if (res.ok) showToast('✅ Ticket enviado!');
    } catch { showToast('⚠️ Erro ao enviar'); }
  }, [showToast]);

  const refreshAll = useCallback(async () => {
    showToast('🔄 Atualizando...');
    await fetchRemoteKeys();
    showToast('✅ Dados atualizados!');
  }, [fetchRemoteKeys, showToast]);

  const clearSessions = useCallback(() => {
    showToast('✅ Sessões encerradas localmente');
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      currentPage, navigate,
      openModal, showModal, closeModal,
      generatedKeys, apiKeys, packages,
      limitCount, keyLimit, chartData,
      selectedIds, activeDeviceKey, setActiveDeviceKey,
      toast, showToast,
      getMergedKeys, createKeys, deleteSelected, toggleSelect,
      fetchRemoteKeys, addPackage, togglePkg, deletePkg,
      resetAllKeys, doDeviceAction, openDeviceActionModal,
      lang, setLang,
      sendSupportTicket, copyText, refreshAll, clearSessions,
      deletedIds,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
};
