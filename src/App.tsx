import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import StudyHub from './components/StudyHub';
import FlowchartHub from './pages/FlowchartHub';
import Settings from './pages/Settings';
import Auth from './components/Auth';
import AIChatWidget from './components/AIChatWidget';
import { useAuth } from './context/AuthContext';
import { LayoutDashboard, BookOpen, BarChart2, GitBranch, Settings as SettingsIcon, LogOut } from 'lucide-react';
import './index.css';

const NAV_ITEMS = [
  { to: '/', id: 'board', icon: LayoutDashboard, label: 'Applications' },
  { to: '/flowcharts', id: 'flowcharts', icon: GitBranch, label: 'Flowcharts' },
  { to: '/analytics', id: 'analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/resources', id: 'resources', icon: BookOpen, label: 'Study Hub' },
  { to: '/settings', id: 'settings', icon: SettingsIcon, label: 'Settings' },
];

function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const { session, signOut } = useAuth();
  const location = useLocation();

  return (
    <div
      className="sidebar"
      style={{ width: collapsed ? '64px' : '220px', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}
    >
      {/* Logo / Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'none', border: 'none', cursor: 'pointer',
          marginBottom: '2rem', padding: '0.25rem', width: '100%',
          color: 'var(--text-primary)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <LayoutDashboard size={22} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
        {!collapsed && <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>Job Tracker</span>}
      </button>

      {/* Nav Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {NAV_ITEMS.map(({ to, id, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          return (
            <Link
              key={id}
              to={to}
              className={`nav-link ${active ? 'active' : ''}`}
              title={collapsed ? label : ''}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0.75rem' : '0.75rem 1rem' }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: email + sign out */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
        {!collapsed && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', paddingLeft: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.user?.email}
          </p>
        )}
        <button
          onClick={signOut}
          className="nav-link"
          title={collapsed ? 'Sign Out' : ''}
          style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            width: '100%', textAlign: 'left', color: 'var(--danger-color)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '0.75rem' : '0.75rem 1rem',
          }}
        >
          <LogOut size={20} style={{ flexShrink: 0 }} />
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

function MobileNavBar() {
  const location = useLocation();

  return (
    <div className="mobile-nav-bar">
      {NAV_ITEMS.map(({ to, id, icon: Icon, label }) => {
        const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
        return (
          <Link
            key={id}
            to={to}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function App() {
  const { session } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!session) return <Auth />;

  return (
    <Router>
      <div id="root">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/flowcharts" element={
              <>
                <div className="topbar"><h1 className="page-title">Architecture Flowcharts</h1></div>
                <FlowchartHub />
              </>
            } />
            <Route path="/analytics" element={
              <>
                <div className="topbar"><h1 className="page-title">Analytics</h1></div>
                <Analytics />
              </>
            } />
            <Route path="/resources" element={
              <>
                <div className="topbar"><h1 className="page-title">Study Hub</h1></div>
                <StudyHub />
              </>
            } />
            <Route path="/settings" element={
              <>
                <div className="topbar"><h1 className="page-title">Settings</h1></div>
                <Settings />
              </>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNavBar />

        <AIChatWidget />

        {/* Global Toastify Container */}
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </Router>
  );
}

export default App;
