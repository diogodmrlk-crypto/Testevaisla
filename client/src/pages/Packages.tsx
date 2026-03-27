import { useApp } from '../contexts/AppContext';

export default function Packages() {
  const { packages, togglePkg, deletePkg, showModal } = useApp();

  return (
    <div className="page active" id="page-packages">
      <div className="page-header">
        <div className="page-header-title">Pacotes</div>
        <div className="page-header-actions">
          <button className="ph-btn" onClick={() => showModal('pkg')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
      <div className="scroll-area">
        {packages.length === 0 ? (
          <div className="empty"><div className="empty-icon">📦</div><div className="empty-text">Nenhum package ainda</div></div>
        ) : (
          packages.map((p, i) => (
            <div key={p.id} className="pkg-item">
              <div className="pkg-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a56e8" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              </div>
              <div className="pkg-body">
                <div className="pkg-name">{p.name}</div>
                <div className="pkg-url-hidden">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  URL protegida
                </div>
                {p.desc && <div className="item-meta" style={{ marginTop: 4, fontSize: 11 }}>{p.desc}</div>}
                <div className="pkg-sent">✦ {p.sent || 0} keys enviadas</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <div className={`toggle${p.enabled ? '' : ' off'}`} onClick={() => togglePkg(i)}>
                  <div className="toggle-knob"></div>
                </div>
                <button onClick={() => deletePkg(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
