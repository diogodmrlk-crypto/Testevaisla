import { useAuth } from '../contexts/AuthContext';

export default function GlobalNotifications() {
  const { pendingAlerts, dismissAlert } = useAuth();

  if (pendingAlerts.length === 0) return null;

  const alert = pendingAlerts[0];

  return (
    <div className="alert-overlay">
      <div className="alert-card">
        <div className="alert-icon">
          {alert.type === 'kick' ? '🚫' : '📢'}
        </div>
        <div className="alert-sender">Mensagem de {alert.sender}</div>
        <div className="alert-message">{alert.message}</div>
        <div className="alert-time">
          {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <button
          className="alert-dismiss-btn"
          onClick={() => {
            dismissAlert(alert.id);
            if (alert.type === 'kick') {
              localStorage.removeItem('authSession');
              window.location.reload();
            }
          }}
        >
          {alert.type === 'kick' ? 'Entendido' : 'Fechar'}
        </button>
        {pendingAlerts.length > 1 && (
          <div className="alert-more">+{pendingAlerts.length - 1} mensagem(ns) pendente(s)</div>
        )}
      </div>
    </div>
  );
}
