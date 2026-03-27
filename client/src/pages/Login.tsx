import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  function getHWID() {
    let hwid = localStorage.getItem('device_hwid');
    if (!hwid) {
      hwid = 'WEB-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('device_hwid', hwid);
    }
    return hwid;
  }

  const handleLogin = async () => {
    const hwid = getHWID();
    const result = await login(key, hwid);
    if (!result.success) setError(result.message);
    else setError('');
  };

  return (
    <div id="login-page">
      <div className="login-container">
        <div className="login-logo">🔑</div>
        <div className="login-title">Bem-vindo!</div>
        <div className="login-subtitle">Insira sua key para continuar</div>
        <input
          className="login-input"
          type="text"
          placeholder="Sua Key de Acesso"
          value={key}
          onChange={e => setKey(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button className="login-btn" onClick={handleLogin}>Entrar</button>
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}
