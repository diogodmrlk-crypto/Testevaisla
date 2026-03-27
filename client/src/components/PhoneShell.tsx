import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import Login from '../pages/Login';
import HomeContent from '../pages/Home';
import Keys from '../pages/Keys';
import Devices from '../pages/Devices';
import Packages from '../pages/Packages';
import Profile from '../pages/Profile';
import AdminPanel from '../pages/AdminPanel';
import { CreateModal, PkgModal, IntegrationModal, DeviceActionModal, LangModal, SupportModal } from './Modals';

type Page = 'home' | 'keys' | 'devices' | 'packages' | 'profile' | 'admin';

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  {
    id: 'home', label: 'Home',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    id: 'keys', label: 'Keys',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3"/></svg>,
  },
  {
    id: 'devices', label: 'Devices',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  },
  {
    id: 'packages', label: 'Pacotes',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  },
  {
    id: 'profile', label: 'Perfil',
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
];

export default function PhoneShell() {
  const { isLoggedIn, session } = useAuth();
  const { currentPage, navigate, toast } = useApp();

  if (!isLoggedIn) {
    return (
      <div className="phone">
        <Login />
      </div>
    );
  }

  const isDev = session?.keyLevel === 'DEV';

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomeContent />;
      case 'keys': return <Keys />;
      case 'devices': return <Devices />;
      case 'packages': return <Packages />;
      case 'profile': return <Profile />;
      case 'admin': return isDev ? <AdminPanel /> : <HomeContent />;
      default: return <HomeContent />;
    }
  };

  return (
    <div className="phone">
      {renderPage()}
      <nav className="bottom-nav" style={isDev ? { gridTemplateColumns: 'repeat(6,1fr)' } : undefined}>
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item${currentPage === item.id ? ' active' : ''}`}
            onClick={() => navigate(item.id)}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
        {isDev && (
          <div
            className={`nav-item${currentPage === 'admin' ? ' active' : ''}`}
            onClick={() => navigate('admin')}
            style={{ color: currentPage === 'admin' ? '#f59e0b' : undefined }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span className="nav-label" style={{ color: currentPage === 'admin' ? '#f59e0b' : undefined }}>Admin</span>
          </div>
        )}
      </nav>
      <CreateModal />
      <PkgModal />
      <IntegrationModal />
      <DeviceActionModal />
      <LangModal />
      <SupportModal />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
