import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

export default function Home() {
  const { session } = useAuth();
  const { getMergedKeys, limitCount, keyLimit, chartData, showModal, navigate, fetchRemoteKeys, showToast, copyText } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const keyLevel = session?.keyLevel || 'BASIC';
  const activeKey = session?.activeKey || '';
  const pct = Math.min((limitCount / keyLimit) * 100, 100);
  const limitBarColor = pct > 90 ? 'linear-gradient(90deg,#f87171,#ef4444)' : pct > 70 ? 'linear-gradient(90deg,#fbbf24,#f59e0b)' : 'linear-gradient(90deg,#4ade80,#22c55e)';

  const allKeys = getMergedKeys();
  const statPending = allKeys.filter(k => !k.used).length;
  const statActive = allKeys.filter(k => k.used).length;
  const homeKeys = allKeys.slice(0, 5);

  const buildChartData = () => {
    const out: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      out[k] = chartData[k] || 0;
    }
    return out;
  };

  const renderChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 340;
    const H = 170;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const raw = buildChartData();
    const labels = Object.keys(raw).map(d => d.slice(5));
    const values = Object.values(raw);
    const maxV = Math.max(...values, 5);
    const pad = { l: 36, r: 14, t: 14, b: 30 };
    const W2 = W - pad.l - pad.r;
    const H2 = H - pad.t - pad.b;
    ctx.clearRect(0, 0, W, H);
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = '#e9ecf3';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (H2 / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillStyle = '#9ca3af'; ctx.font = '9px DM Sans'; ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxV - (maxV / 4) * i)), pad.l - 4, y + 4);
    }
    ctx.setLineDash([]);
    const pts = values.map((v, i) => ({ x: pad.l + (W2 / (values.length - 1 || 1)) * i, y: pad.t + H2 - (v / maxV) * H2 }));
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + H2);
    grad.addColorStop(0, 'rgba(26,86,232,0.18)'); grad.addColorStop(1, 'rgba(26,86,232,0)');
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
    ctx.lineTo(pts[pts.length - 1].x, pad.t + H2); ctx.lineTo(pts[0].x, pad.t + H2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.strokeStyle = '#1a56e8'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#1a56e8'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    });
    ctx.fillStyle = '#9ca3af'; ctx.font = '9px DM Sans'; ctx.textAlign = 'center';
    labels.forEach((l, i) => ctx.fillText(l, pts[i].x, H - 6));
  };

  useEffect(() => { renderChart(); }, [chartData, limitCount]);
  useEffect(() => {
    window.addEventListener('resize', renderChart);
    return () => window.removeEventListener('resize', renderChart);
  }, []);

  const refreshAll = async () => {
    showToast('🔄 Atualizando...');
    await fetchRemoteKeys();
    showToast('✅ Dados atualizados!');
  };

  return (
    <div className="page active" id="page-home">
      <div className="home-header">
        <div className="home-top">
          <div className="user-info">
            <div className="avatar">F</div>
            <div>
              <div className="user-name">FERRAO</div>
              <div className="user-plan">Plano {keyLevel} • Ativo</div>
            </div>
          </div>
          <div className="header-icons">
            <button onClick={refreshAll}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.5M22 12.5a10 10 0 0 1-18.8 4.5"/></svg>
            </button>
            <button onClick={() => showModal('lang')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </button>
          </div>
        </div>
        <div className="limit-bar-wrap">
          <div className="limit-row">
            <span className="limit-label">Keys Geradas</span>
            <span className="limit-count">{limitCount.toLocaleString('pt-BR')} / {keyLimit.toLocaleString('pt-BR')}</span>
          </div>
          <div className="limit-bar-bg">
            <div className="limit-bar-fill" style={{ width: pct + '%', background: limitBarColor }}></div>
          </div>
        </div>
        <div className="stats-cards">
          <div className="stat-card" onClick={() => navigate('keys')}>
            <div className="stat-label">Pendentes</div>
            <div className="stat-num">{statPending}</div>
            <div className="stat-footer"><span className="stat-sub">Ver todas</span><div className="go-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div></div>
          </div>
          <div className="stat-card" onClick={() => navigate('devices')}>
            <div className="stat-label">Ativas</div>
            <div className="stat-num">{statActive}</div>
            <div className="stat-footer"><span className="stat-sub">Devices</span><div className="go-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div></div>
          </div>
        </div>
      </div>
      <div className="home-body">
        <div className="quick-actions">
          <div className="qa-btn" onClick={() => showModal('create')}>
            <div className="qa-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56e8" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
            <div className="qa-label">Criar Key</div>
          </div>
          <div className="qa-btn" onClick={() => navigate('keys')}>
            <div className="qa-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56e8" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3"/></svg></div>
            <div className="qa-label">Keys</div>
          </div>
          <div className="qa-btn" onClick={() => navigate('devices')}>
            <div className="qa-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56e8" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg></div>
            <div className="qa-label">Devices</div>
          </div>
          <div className="qa-btn" onClick={() => navigate('packages')}>
            <div className="qa-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56e8" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
            <div className="qa-label">Pacotes</div>
          </div>
        </div>

        <div className="section-title">Ativações Recentes</div>
        <div className="chart-card">
          <div className="chart-legend"><div className="chart-dot"></div><span className="chart-legend-label">Keys geradas por dia</span></div>
          <canvas ref={canvasRef}></canvas>
        </div>

        <div className="section-title">Últimas Keys</div>
        {homeKeys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 12 }}>Nenhuma key gerada</div>
        ) : (
          homeKeys.map(k => (
            <div key={k.id} className="list-item" style={{ borderRadius: 12, marginBottom: 5, boxShadow: 'var(--shadow)', border: 'none' }}>
              <div className="item-body">
                <div className="item-key" style={{ fontSize: 12.5 }}>{k.key}</div>
                <div className="item-meta">{k.type}</div>
              </div>
              <span className={`badge ${k.used ? 'active' : 'pending'}`}>{k.used ? 'Ativa' : 'Pendente'}</span>
              <button className="copy-btn" onClick={e => { e.stopPropagation(); copyText(k.key); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          ))
        )}
        <div style={{ textAlign: 'center', marginTop: 15 }}>
          <button className="ph-btn-text" onClick={() => navigate('keys')}>Ver todas →</button>
        </div>
      </div>
    </div>
  );
}
