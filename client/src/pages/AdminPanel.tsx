import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

interface SessionUser {
  id: string;
  key: string;
  keyLevel: string;
  hwid: string;
  ip: string;
  loginAt: number;
  lastSeen: number;
}

interface BannedIP {
  ip: string;
  key: string;
  keyLevel: string;
  bannedAt: number;
  reason: string;
}

type Tab = 'accounts' | 'banidos';

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return `${s}s atrás`;
  if (s < 3600) return `${Math.floor(s / 60)}min atrás`;
  return `${Math.floor(s / 3600)}h atrás`;
}

export default function AdminPanel() {
  const { session, forceRefreshSession } = useAuth();
  const { navigate, showToast } = useApp();
  const [tab, setTab] = useState<Tab>('accounts');
  const [sessions, setSessions] = useState<SessionUser[]>([]);
  const [bans, setBans] = useState<BannedIP[]>([]);
  const [selectedUser, setSelectedUser] = useState<SessionUser | null>(null);
  const [selectedBan, setSelectedBan] = useState<BannedIP | null>(null);
  const [warnMsg, setWarnMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) setSessions(await res.json());
    } catch {}
  };

  const fetchBans = async () => {
    try {
      const res = await fetch('/api/bans');
      if (res.ok) setBans(await res.json());
    } catch {}
  };

  useEffect(() => {
    forceRefreshSession();
    fetchSessions();
    fetchBans();
    pollRef.current = setInterval(() => {
      fetchSessions();
      fetchBans();
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleKick = async (user: SessionUser) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${user.id}`, { method: 'DELETE', signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        showToast(`🚫 ${user.key} kickado e IP banido!`);
        setSelectedUser(null);
        await fetchSessions();
        await fetchBans();
      }
    } catch {
      showToast('⚠️ Erro ao kickar');
    }
    setLoading(false);
  };

  const handleWarn = async (user: SessionUser) => {
    if (!warnMsg.trim()) { showToast('⚠️ Digite uma mensagem'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user.id, message: warnMsg.trim(), sender: 'DEV' }),
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        showToast(`📢 Aviso enviado para ${user.key}!`);
        setWarnMsg('');
        setSelectedUser(null);
      }
    } catch {
      showToast('⚠️ Erro ao enviar aviso');
    }
    setLoading(false);
  };

  const handleUnban = async (ban: BannedIP) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bans/${encodeURIComponent(ban.ip)}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        showToast(`✅ Ban removido: ${ban.ip}`);
        setSelectedBan(null);
        await fetchBans();
      }
    } catch {
      showToast('⚠️ Erro ao remover ban');
    }
    setLoading(false);
  };

  return (
    <div className="page active" id="page-admin" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="admin-header">
        <button className="admin-back-btn" onClick={() => navigate('home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="admin-header-info">
          <div className="admin-title">Painel DEV</div>
          <div className="admin-subtitle">{session?.activeKey}</div>
        </div>
        <div className="admin-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          DEV
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab${tab === 'accounts' ? ' active' : ''}`} onClick={() => setTab('accounts')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Accounts
          <span className="admin-tab-count">{sessions.length}</span>
        </button>
        <button className={`admin-tab${tab === 'banidos' ? ' active' : ''}`} onClick={() => setTab('banidos')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          Banidos
          <span className="admin-tab-count" style={{ background: bans.length > 0 ? '#ef4444' : undefined, color: bans.length > 0 ? '#fff' : undefined }}>{bans.length}</span>
        </button>
      </div>

      <div className="admin-content">
        {tab === 'accounts' && (
          <div>
            <div className="admin-section-header">
              <span>Usuários ativos em tempo real</span>
              <span className="admin-live-dot">● LIVE</span>
            </div>

            {sessions.length === 0 ? (
              <div className="admin-empty">
                <div style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
                <div>Nenhum usuário ativo</div>
              </div>
            ) : (
              sessions.map(user => (
                <div key={user.id}>
                  <div
                    className={`admin-user-card${selectedUser?.id === user.id ? ' selected' : ''}`}
                    onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                  >
                    <div className="admin-user-avatar" style={{
                      background: user.keyLevel === 'DEV' ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                        : user.keyLevel === 'PRO' ? 'linear-gradient(135deg,#1a56e8,#1240c0)'
                        : 'linear-gradient(135deg,#22c55e,#16a34a)'
                    }}>
                      {user.key[0]}
                    </div>
                    <div className="admin-user-info">
                      <div className="admin-user-key">{user.key}</div>
                      <div className="admin-user-meta">IP: {user.ip} • {timeAgo(user.lastSeen)}</div>
                    </div>
                    <span className="admin-level-badge" style={{
                      background: user.keyLevel === 'DEV' ? '#fef3c7' : user.keyLevel === 'PRO' ? '#dbeafe' : '#dcfce7',
                      color: user.keyLevel === 'DEV' ? '#92400e' : user.keyLevel === 'PRO' ? '#1d4ed8' : '#15803d'
                    }}>
                      {user.keyLevel}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                      style={{ transform: selectedUser?.id === user.id ? 'rotate(90deg)' : undefined, transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>

                  {selectedUser?.id === user.id && (
                    <div className="admin-actions-panel">
                      <div className="admin-action-title">Ações para {user.key}</div>

                      <div className="admin-action-item admin-action-kick" onClick={() => !loading && handleKick(user)}>
                        <div className="admin-action-icon" style={{ background: '#fee2e2' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        </div>
                        <div className="admin-action-text">
                          <div className="admin-action-label">Tirar Usuário da Conta</div>
                          <div className="admin-action-sub">O IP não vai conseguir logar dnv!</div>
                        </div>
                      </div>

                      <div className="admin-warn-section">
                        <div className="admin-action-icon" style={{ background: '#fef3c7', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="admin-action-label" style={{ marginBottom: 6 }}>Mandar Aviso</div>
                          <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 8 }}>Aparece na tela dele • Enviado por: DEV</div>
                          <input
                            className="admin-warn-input"
                            placeholder="Mensagem do aviso..."
                            value={warnMsg}
                            onChange={e => setWarnMsg(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleWarn(user)}
                          />
                          <button
                            className="admin-warn-btn"
                            onClick={() => handleWarn(user)}
                            disabled={loading || !warnMsg.trim()}
                          >
                            {loading ? 'Enviando...' : 'Enviar Aviso'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'banidos' && (
          <div>
            <div className="admin-section-header">
              <span>IPs banidos</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{bans.length} ban(s)</span>
            </div>

            {bans.length === 0 ? (
              <div className="admin-empty">
                <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
                <div>Nenhum IP banido</div>
              </div>
            ) : (
              bans.map(ban => (
                <div key={ban.ip}>
                  <div
                    className={`admin-user-card${selectedBan?.ip === ban.ip ? ' selected' : ''}`}
                    onClick={() => setSelectedBan(selectedBan?.ip === ban.ip ? null : ban)}
                  >
                    <div className="admin-user-avatar" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', fontSize: 16 }}>
                      🚫
                    </div>
                    <div className="admin-user-info">
                      <div className="admin-user-key">{ban.ip}</div>
                      <div className="admin-user-meta">{ban.key} • {timeAgo(ban.bannedAt)}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"
                      style={{ transform: selectedBan?.ip === ban.ip ? 'rotate(90deg)' : undefined, transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>

                  {selectedBan?.ip === ban.ip && (
                    <div className="admin-actions-panel" style={{ borderColor: '#22c55e' }}>
                      <div className="admin-action-title">IP: {ban.ip}</div>
                      <div className="admin-action-item" style={{ borderColor: '#22c55e' }} onClick={() => !loading && handleUnban(ban)}>
                        <div className="admin-action-icon" style={{ background: '#dcfce7' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div className="admin-action-text">
                          <div className="admin-action-label" style={{ color: '#22c55e' }}>Remover Ban por IP</div>
                          <div className="admin-action-sub">O usuário vai poder logar novamente</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
