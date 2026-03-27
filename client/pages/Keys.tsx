import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

export default function Keys() {
  const { getMergedKeys, selectedIds, toggleSelect, deleteSelected, showModal, copyText } = useApp();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const allKeys = getMergedKeys();
  const filtered = search
    ? allKeys.filter(k => k.key.toLowerCase().includes(search.toLowerCase()) || k.type.toLowerCase().includes(search.toLowerCase()))
    : allKeys;

  const copyAllPending = async () => {
    const pending = allKeys.filter(k => !k.used).map(k => k.key);
    if (!pending.length) { return; }
    await copyText(pending.join('\n'), `${pending.length} keys copiadas!`);
  };

  return (
    <div className="page active" id="page-keys">
      <div className="page-header">
        <div className="page-header-title">Keys</div>
        <div className="page-header-actions">
          <button className="ph-btn" onClick={() => { setShowSearch(s => !s); setSearch(''); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button className="ph-btn" onClick={() => showModal('create')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button className="ph-btn-text" onClick={deleteSelected}>Excluir</button>
        </div>
      </div>
      {showSearch && (
        <div className="search-bar">
          <input className="search-input" placeholder="Buscar keys..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
      )}
      <div className="scroll-area">
        {filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon">🔑</div><div className="empty-text">Nenhuma key encontrada</div></div>
        ) : (
          filtered.map(k => {
            const isSelected = selectedIds.has(k.id);
            return (
              <div key={k.id} className={`list-item${isSelected ? ' selected' : ''}`} onClick={() => toggleSelect(k.id)}>
                <div className={`item-check${isSelected ? ' checked' : ''}`}></div>
                <div className="item-body">
                  <div className="item-key">{k.key}</div>
                  <div className="item-meta">{k.type} · {k._pkg || 'API'}</div>
                </div>
                <span className={`badge ${k.used ? 'active' : 'pending'}`}>{k.used ? 'Ativa' : 'Pendente'}</span>
                <button className="copy-btn" onClick={e => { e.stopPropagation(); copyText(k.key); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
            );
          })
        )}
        <div style={{ textAlign: 'center', marginTop: 15 }}>
          <button className="ph-btn-text" onClick={copyAllPending}>Copiar todas pendentes</button>
        </div>
      </div>
    </div>
  );
}
