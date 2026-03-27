import { useAuth } from './contexts/AuthContext';
import { AppProvider, useApp } from './contexts/AppContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Keys from './pages/Keys';
import Devices from './pages/Devices';
import Packages from './pages/Packages';
import Profile from './pages/Profile';
import { CreateModal, PkgModal, IntegrationModal, DeviceActionModal, LangModal, SupportModal } from './components/Modals';

function BottomNav() {
  const { currentPage, navigate } = useApp();
  return (
    <nav className="bottom-nav">
      <div className={`nav-item${currentPage === 'home' ? ' active' : ''}`} onClick={() => navigate('home')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5" opacity="0.85"/><rect x="14" y="3" width="7" height="7" rx="1.5" opacity="0.85"/><rect x="3" y="14" width="7" height="7" rx="1.5" opacity="0.85"/><rect x="14" y="14" width="7" height="7" rx="1.5" opacity="0.85"/></svg>
        <span className="nav-label">Home</span>
      </div>
      <div className={`nav-item${currentPage === 'keys' ? ' active' : ''}`} onClick={() => navigate('keys')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3"/></svg>
        <span className="nav-label">Keys</span>
      </div>
      <div className={`nav-item${currentPage === 'devices' ? ' active' : ''}`} onClick={() => navigate('devices')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        <span className="nav-label">Devices</span>
      </div>
      <div className={`nav-item${currentPage === 'packages' ? ' active' : ''}`} onClick={() => navigate('packages')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <span className="nav-label">Pacotes</span>
      </div>
      <div className={`nav-item${currentPage === 'profile' ? ' active' : ''}`} onClick={() => navigate('profile')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span className="nav-label">Perfil</span>
      </div>
    </nav>
  );
}

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}

function MainApp() {
  const { currentPage } = useApp();
  return (
    <div className="phone">
      {currentPage === 'home' && <Home />}
      {currentPage === 'keys' && <Keys />}
      {currentPage === 'devices' && <Devices />}
      {currentPage === 'packages' && <Packages />}
      {currentPage === 'profile' && <Profile />}
      <BottomNav />
      <CreateModal />
      <PkgModal />
      <IntegrationModal />
      <DeviceActionModal />
      <LangModal />
      <SupportModal />
      <Toast />
    </div>
  );
}

function AppInner() {
  const { isLoggedIn, session } = useAuth();
  const keyLimit = session?.keyData?.limit ?? 500;

  if (!isLoggedIn) {
    return (
      <div className="phone">
        <Login />
      </div>
    );
  }

  return (
    <AppProvider keyLimit={keyLimit}>
      <MainApp />
    </AppProvider>
  );
}

export default function App() {
  return <AppInner />;
}
