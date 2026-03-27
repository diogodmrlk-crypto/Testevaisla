import { useState } from 'react';
import { useApp } from '../contexts/AppContext';

function CloseBtn({ id }: { id: string }) {
  const { closeModal } = useApp();
  return (
    <button className="modal-close-btn" onClick={closeModal}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  );
}

function ModalWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { openModal, closeModal } = useApp();
  const isOpen = openModal === id;
  return (
    <div className={`modal-overlay${isOpen ? ' open' : ''}`} onClick={e => { if ((e.target as HTMLElement).classList.contains('modal-overlay')) closeModal(); }}>
      <div className="modal">{children}</div>
    </div>
  );
}

export function CreateModal() {
  const { packages, createKeys, copyText, closeModal } = useApp();
  const [qty, setQty] = useState(1);
  const [type, setType] = useState('weekly');
  const [dur, setDur] = useState(1);
  const [pkgId, setPkgId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);

  const enabledPkgs = packages.filter(p => p.enabled);

  const preview = `GHOST-${type}-${'X'.repeat(8)}${Math.floor(Math.random() * 99999)}`;

  const handleCreate = async () => {
    if (!pkgId) { return; }
    setLoading(true);
    setGeneratedKeys([]);
    const before = Date.now();
    await createKeys(Math.min(qty, 100), type, dur, pkgId);
    setLoading(false);
  };

  const copyAll = () => copyText(generatedKeys.join('\n'), `${generatedKeys.length} keys copiadas!`);

  return (
    <ModalWrapper id="create">
      <div className="modal-handle"></div>
      <div className="modal-header">
        <span className="modal-title">✦ Gerar Key</span>
        <CloseBtn id="create" />
      </div>
      <div className="form-group">
        <label className="form-label">Quantidade</label>
        <input className="form-input" type="number" value={qty} min={1} max={100} onChange={e => setQty(Number(e.target.value))} />
      </div>
      <div className="form-group">
        <label className="form-label">Tipo</label>
        <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
          <option value="weekly">1 Semana</option>
          <option value="monthly">1 Mês</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Duração (dias)</label>
        <input className="form-input" type="number" value={dur} min={1} onChange={e => setDur(Number(e.target.value))} />
      </div>
      <div className="form-group">
        <label className="form-label">Package</label>
        <select className="form-select" value={pkgId} onChange={e => setPkgId(e.target.value)}>
          <option value="">— Selecionar package —</option>
          {enabledPkgs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Preview</label>
        <input className="form-input" readOnly value={preview} />
      </div>
      {generatedKeys.length > 0 && (
        <div className="generated-results">
          <div className="generated-results-header">
            <div className="generated-results-title">Keys Geradas</div>
            <button className="ph-btn-text" onClick={copyAll}>Copiar todas</button>
          </div>
          {generatedKeys.map((k, i) => (
            <div key={i} className="result-key-item">
              <div className="result-key-text">{k}</div>
              <button className="result-copy-btn" onClick={() => copyText(k)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <button className="create-btn" disabled={loading} onClick={handleCreate}>
        {loading ? '⏳ Gerando...' : '✦ Gerar Keys'}
      </button>
    </ModalWrapper>
  );
}

export function PkgModal() {
  const { addPackage, closeModal } = useApp();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  const handle = () => {
    if (!name) return;
    if (!url || !url.startsWith('http')) return;
    addPackage(name, url, desc);
    setName(''); setUrl(''); setDesc('');
    closeModal();
  };

  return (
    <ModalWrapper id="pkg">
      <div className="modal-handle"></div>
      <div className="modal-header">
        <span className="modal-title">📦 Novo Package</span>
        <CloseBtn id="pkg" />
      </div>
      <div className="form-group">
        <label className="form-label">Nome do Package <span className="req">*</span></label>
        <input className="form-input" placeholder="Ex: api, loja1, scripts..." value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">URL da API <span className="req">*</span></label>
        <input className="form-input" type="url" placeholder="https://sua-api.com/keys" value={url} onChange={e => setUrl(e.target.value)} />
        <div className="form-hint">As keys serão enviadas via POST para essa URL (URL ficará oculta)</div>
      </div>
      <div className="form-group">
        <label className="form-label">Descrição (opcional)</label>
        <input className="form-input" placeholder="Ex: API do sistema de scripts..." value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <button className="create-btn" onClick={handle}>+ Adicionar Package</button>
    </ModalWrapper>
  );
}

export function IntegrationModal() {
  const { packages, copyText } = useApp();
  const apiUrl = packages[0]?.url || 'https://teste-api-mcok.vercel.app/keys';
  const jsCode = `// Fetch API Example\nfetch("${apiUrl}")\n  .then(res => res.json())\n  .then(data => console.log(data));`;
  const luauCode = `-- Roblox Example\nlocal res = game:GetService("HttpService"):GetAsync("${apiUrl}")\nprint(res)`;

  return (
    <ModalWrapper id="integration">
      <div className="modal-handle"></div>
      <div className="modal-header">
        <span className="modal-title">🔌 Integração</span>
        <CloseBtn id="integration" />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Verificar key (JavaScript/Fetch)</div>
      <div className="preview-box" style={{ cursor: 'pointer' }} onClick={() => copyText(jsCode, 'Código copiado!')}>{jsCode}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '12px 0 8px' }}>Verificar key (Luau / Roblox)</div>
      <div className="preview-box" style={{ cursor: 'pointer' }} onClick={() => copyText(luauCode, 'Código copiado!')}>{luauCode}</div>
      <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 8 }}>👆 Clique no código para copiar</div>
    </ModalWrapper>
  );
}

export function DeviceActionModal() {
  const { activeDeviceKey, doDeviceAction, closeModal } = useApp();
  return (
    <ModalWrapper id="device-action">
      <div className="modal-handle"></div>
      <div className="modal-header">
        <span className="modal-title">📱 Ações do Device</span>
        <CloseBtn id="device-action" />
      </div>
      <div className="device-action-info">
        <div className="device-action-info-key">{activeDeviceKey?.key || '–'}</div>
        <div className="device-action-info-dev">📱 {activeDeviceKey?.device || 'Device desconhecido'}</div>
      </div>
      <div className="device-action-list">
        <div className="device-action-item" onClick={() => doDeviceAction('reset')}>
          <div className="dai-icon reset">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>
          </div>
          <div><div className="dai-label">Resetar Device</div><div className="dai-sub">Remove o vínculo com o device, key fica disponível novamente</div></div>
        </div>
        <div className="device-action-item" onClick={() => doDeviceAction('revoke')}>
          <div className="dai-icon revoke">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div><div className="dai-label" style={{ color: '#ef4444' }}>Revogar Device</div><div className="dai-sub">Exclui a key permanentemente da API e do sistema</div></div>
        </div>
      </div>
    </ModalWrapper>
  );
}

export function LangModal() {
  const { lang, setLang, closeModal } = useApp();
  const setLanguage = (l: string) => { setLang(l); closeModal(); };
  return (
    <ModalWrapper id="lang">
      <div className="modal-handle"></div>
      <div className="modal-header">
        <span className="modal-title">🌐 Language</span>
        <CloseBtn id="lang" />
      </div>
      <div>
        {[{ code: 'en', flag: '🇺🇸', label: 'English' }, { code: 'pt', flag: '🇧🇷', label: 'Português (BR)' }, { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' }].map(l => (
          <div key={l.code} className="lang-option" onClick={() => setLanguage(l.code)}>
            <span className="lang-flag">{l.flag}</span>
            <span className="lang-name">{l.label}</span>
            <div className={`lang-check${lang === l.code ? ' selected' : ''}`}></div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
}

export function SupportModal() {
  const { sendSupportTicket, closeModal } = useApp();
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!name || !problem || !desc) return;
    setLoading(true);
    await sendSupportTicket(name, problem, desc);
    setLoading(false);
    closeModal();
  };

  return (
    <ModalWrapper id="support">
      <div className="modal-handle"></div>
      <div className="modal-header">
        <span className="modal-title">🎧 Support</span>
        <CloseBtn id="support" />
      </div>
      <div className="support-hero">
        <div className="support-hero-icon">🛟</div>
        <div className="support-hero-title">Como podemos ajudar?</div>
        <div className="support-hero-sub">Preencha o formulário e responderemos em breve via Discord</div>
      </div>
      <div className="form-group">
        <label className="form-label">Nome <span className="req">*</span></label>
        <input className="form-input" placeholder="Seu nome ou usuário..." value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Problema <span className="req">*</span></label>
        <select className="form-select" value={problem} onChange={e => setProblem(e.target.value)}>
          <option value="">— Selecione o tipo de problema —</option>
          <option value="Key não funciona">🔑 Key não funciona</option>
          <option value="Erro ao gerar key">⚠️ Erro ao gerar key</option>
          <option value="Problema com device">📱 Problema com device</option>
          <option value="Problema com package">📦 Problema com package</option>
          <option value="Erro de login">🔐 Erro de login</option>
          <option value="Pagamento / Plano">💳 Pagamento / Plano</option>
          <option value="Outro">❓ Outro</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Descrição <span className="req">*</span></label>
        <textarea className="form-textarea" placeholder="Descreva o problema com o máximo de detalhes possível..." rows={5} value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <button className="create-btn" disabled={loading} onClick={handle}>{loading ? '⏳ Enviando...' : '📨 Enviar para o Suporte'}</button>
    </ModalWrapper>
  );
}
