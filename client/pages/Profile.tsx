import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export default function Profile() {
  const { session, logout } = useAuth();
  const { showModal, resetAllKeys } = useApp();
  const keyLevel = session?.keyLevel || 'BASIC';
  const activeKey = session?.activeKey || '';

  const confirmLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) logout();
  };

  return (
    <div className="page active" id="page-profile">
      <div className="profile-top-bar">
        <div className="profile-top-avatar">F</div>
        <div>
          <div className="page-header-title">FERRAO</div>
          <div className="user-plan">Plano {keyLevel} • Ativo</div>
        </div>
      </div>
      <div className="scroll-area">
        <div className="list-item" onClick={() => showModal('integration')}>
          <div className="item-body"><div className="item-key">🔌 Código de Integração</div></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div className="list-item" onClick={() => showModal('lang')}>
          <div className="item-body"><div className="item-key">🌐 Idioma</div></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div className="list-item" onClick={() => showModal('support')}>
          <div className="item-body"><div className="item-key">🎧 Suporte</div></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div className="list-item" onClick={resetAllKeys}>
          <div className="item-body"><div className="item-key red-key">Limpar todas as keys</div></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </div>
        <div className="list-item" onClick={confirmLogout}>
          <div className="item-body"><div className="item-key red-key">Sair</div></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray)', fontSize: 12 }}>Versão: 1.0.0 (Prod)</div>
      </div>
    </div>
  );
}
