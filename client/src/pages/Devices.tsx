import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

interface Session {
  device: string;
  platform: string;
  activatedAt: number;
  expiresAt: number;
  ip: string;
  version: string;
  keyCount: number;
}

function detectPlatform(deviceName: string) {
  const d = deviceName.toLowerCase();
  if (d.includes('iphone') || d.includes('ipad') || d.includes('ipod')) return 'iOS';
  if (d.includes('android') || d.includes('samsung') || d.includes('xiaomi') || d.includes('pixel') || d.includes('huawei') || d.includes('motorola') || d.includes('oppo') || d.includes('vivo')) return 'Android';
  if (d.includes('mac') || d.includes('darwin')) return 'macOS';
  if (d.includes('win') || d.includes('windows')) return 'Windows';
  if (d.includes('linux') || d.includes('ubuntu')) return 'Linux';
  return 'Unknown';
}

export default function Devices() {
  const { getMergedKeys, openDeviceActionModal, copyText, showToast, clearSessions } = useApp();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

  const fetchSessions = async () => {
    setSessionsLoading(true);
    setSessionsError('');
    try {
      const res = await fetch('https://teste-api-mcok.vercel.app/keys', { signal: AbortSignal.timeout(10000) });
      const data = await res.json();
      const seenDevices = new Map<string, Session>();
      data.forEach((k: { used: boolean; device: string; activatedAt?: number; expiresAt?: number; ip?: string; clientIp?: string; userIp?: string; ipAddress?: string; version?: string; osVersion?: string }) => {
        if (k.used && k.device) {
          const dev = k.device;
          if (!seenDevices.has(dev)) {
            seenDevices.set(dev, { device: dev, platform: detectPlatform(dev), activatedAt: k.activatedAt || 0, expiresAt: k.expiresAt || 0, ip: k.ip || k.clientIp || k.userIp || k.ipAddress || '', version: k.version || k.osVersion || '–', keyCount: 1 });
          } else {
            const s = seenDevices.get(dev)!;
            s.keyCount++;
            if ((k.activatedAt || 0) > s.activatedAt) {
              s.activatedAt = k.activatedAt || 0;
              s.expiresAt = k.expiresAt || 0;
              s.ip = k.ip || k.clientIp || k.userIp || k.ipAddress || s.ip;
            }
          }
        }
      });
      setSessions([...seenDevices.values()].sort((a, b) => (b.activatedAt || 0) - (a.activatedAt || 0)));
    } catch (e: unknown) {
      setSessionsError(e instanceof Error ? e.message : 'Erro desconhecido');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const allKeys = getMergedKeys();
  const usedKeys = allKeys.filter(k => k.used && k.device);
  const filtered = search
    ? usedKeys.filter(k => k.device?.toLowerCase().includes(search.toLowerCase()) || k.key.toLowerCase().includes(search.toLowerCase()))
    : usedKeys;

  const grouped: Record<string, typeof usedKeys> = {};
  filtered.forEach(k => {
    const dev = k.device || '(desconhecido)';
    if (!grouped[dev]) grouped[dev] = [];
    grouped[dev].push(k);
  });

  return (
    <div className="page active" id="page-devices">
      <div className="page-header">
        <div className="page-header-title">Devices</div>
        <div className="page-header-actions">
          <button className="ph-btn" onClick={() => { setShowSearch(s => !s); setSearch(''); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button className="ph-btn" onClick={() => { showToast('🔄 Atualizando sessões...'); fetchSessions(); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.5M22 12.5a10 10 0 0 1-18.8 4.5"/></svg>
          </button>
          <button className="ph-btn-text" onClick={() => { if (confirm('Marcar todas as sessões como encerradas?')) { setSessions([]); clearSessions(); } }}>Limpar</button>
        </div>
      </div>
      {showSearch && (
        <div className="search-bar">
          <input className="search-input" placeholder="Buscar devices..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
      )}
      <div className="scroll-area">
        {Object.keys(grouped).length === 0 ? (
          <div className="empty"><div className="empty-icon">📱</div><div className="empty-text">Nenhum device conectado</div></div>
        ) : (
          Object.entries(grouped).map(([dev, devKeys]) => {
            const firstKey = devKeys[0];
            const isExpired = firstKey.expiresAt > 0 && firstKey.expiresAt < Date.now() / 1000;
            const activatedAt = firstKey.activatedAt ? new Date(firstKey.activatedAt * 1000).toLocaleString('pt-BR') : '–';
            return (
              <div key={dev} className="device-item">
                <div className="device-item-header">
                  <button className="device-action-btn" onClick={e => { e.stopPropagation(); openDeviceActionModal(firstKey.id); }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><circle cx="12" cy="5" r="1.5" fill="#6366f1"/><circle cx="12" cy="12" r="1.5" fill="#6366f1"/><circle cx="12" cy="19" r="1.5" fill="#6366f1"/></svg>
                  </button>
                  <div className="item-body">
                    <div className="item-key" style={{ fontSize: 13 }}>📱 {dev}</div>
                    <div className="item-meta" style={{ fontSize: 11 }}>Ativado: {activatedAt} · {devKeys.length} key(s)</div>
                  </div>
                  <span className="badge" style={isExpired ? { background: '#fee2e2', color: '#991b1b' } : { background: '#dcfce7', color: '#15803d' }}>{isExpired ? 'Expirado' : 'Online'}</span>
                </div>
                <div className="device-keys-sub">
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Keys vinculadas</div>
                  {devKeys.map(k => {
                    const exp = k.expiresAt > 0 && k.expiresAt < Date.now() / 1000;
                    return (
                      <div key={k.id} className="device-key-sub-row">
                        <div className="device-key-sub-text">{k.key}</div>
                        <span className="badge" style={{ flexShrink: 0, ...(exp ? { background: '#fee2e2', color: '#991b1b' } : { background: '#dcfce7', color: '#15803d' }) }}>{exp ? 'Expirada' : 'Ativa'}</span>
                        <button className="copy-btn" style={{ width: 24, height: 24, marginLeft: 6 }} onClick={e => { e.stopPropagation(); copyText(k.key); }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        <div style={{ margin: '16px 14px 0' }}>
          {sessionsLoading && (
            <div style={{ padding: 30, textAlign: 'center' }}>
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--gray)' }}>Buscando sessões na API...</div>
            </div>
          )}
          {sessionsError && !sessionsLoading && (
            <div className="empty"><div className="empty-icon">⚠️</div><div className="empty-text">Erro ao buscar sessões<br/><small style={{ fontSize: 11, color: '#9ca3af' }}>{sessionsError}</small></div></div>
          )}
          {!sessionsLoading && !sessionsError && sessions.length === 0 && Object.keys(grouped).length === 0 && (
            <div className="empty"><div className="empty-icon">📱</div><div className="empty-text">Nenhum device ativo encontrado</div></div>
          )}
          {!sessionsLoading && sessions.map((s, idx) => {
            const isCurrent = idx === 0;
            const actDate = s.activatedAt > 0 ? new Date(s.activatedAt * 1000).toLocaleString('pt-BR') : '–';
            const expDate = s.expiresAt > 0 ? new Date(s.expiresAt * 1000).toLocaleString('pt-BR') : 'Lifetime';
            const isExpired = s.expiresAt > 0 && s.expiresAt < Date.now() / 1000;
            const emoji = s.platform === 'iOS' ? '📱' : s.platform === 'Android' ? '🤖' : s.platform === 'Windows' ? '💻' : '🖥️';
            return (
              <div key={s.device} style={{ background: 'var(--white)', borderRadius: 16, padding: 16, marginBottom: 12, border: '1px solid #f0f2f7', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{emoji}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.device}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 2 }}>{s.platform}{s.version !== '–' ? ' · v' + s.version : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge" style={isExpired ? { background: '#fee2e2', color: '#991b1b' } : { background: '#dcfce7', color: '#15803d' }}>{isExpired ? 'Expirado' : 'Ativo'}</span>
                    {isCurrent && <span className="badge current">📍 Recente</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                  <div style={{ color: 'var(--gray)' }}>IP: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.ip || '–'}</span></div>
                  <div style={{ color: 'var(--gray)' }}>Keys: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{s.keyCount}</span></div>
                  <div style={{ color: 'var(--gray)' }}>Ativado: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{actDate}</span></div>
                  <div style={{ color: 'var(--gray)' }}>Expira: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{expDate}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
