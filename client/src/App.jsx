/**
 * ChatStruct — Main App
 * Manages global state, routing, Socket.io connection, and layout
 */
import { useState, useEffect, useCallback } from 'react';
import { Search, Bell, Trash2 } from 'lucide-react';
import Sidebar      from './components/Sidebar';
import Dashboard    from './pages/Dashboard';
import CategoryPage from './pages/CategoryPage';
import SearchPage   from './pages/SearchPage';
import WhatsAppLogin from './components/WhatsAppLogin';
import { SocketProvider, useSocket } from './context/SocketContext';
import { api } from './services/api';
import './index.css';

const PAGE_TITLES = {
  dashboard:     '🏠 Dashboard',
  'study-materials': '📚 Study Materials',
  announcements: '📢 Announcements',
  doubts:        '❓ Doubts',
  important:     '🔴 Important',
  general:       '💬 General Chat',
  search:        '🔍 Search',
};

// AppInner reads socket context
function AppInner() {
  const socketCtx = useSocket();
  const serverConnected = socketCtx?.connected ?? false;
  
  const [waStatus, setWaStatus] = useState('initializing'); // 'initializing' | 'awaiting_qr' | 'authenticated' | 'ready' | 'disconnected'
  const connected = waStatus === 'ready';

  const [activePage, setActivePage] = useState('dashboard');
  const [messages,   setMessages]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [toast,      setToast]      = useState(null);
  const [searchVal,  setSearchVal]  = useState('');
  const [clearLoading, setClearLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const loadStats = useCallback(() => {
    api.getStats().then(setStats).catch(() => {});
  }, []);

  const loadMessages = useCallback(() => {
    api.getMessages().then(setMessages).catch(() => {});
  }, []);

  const loadWaStatus = useCallback(() => {
    api.getWhatsAppInfo()
      .then(res => {
        if (res.status) setWaStatus(res.status);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadMessages();
    loadStats();
    loadWaStatus();
  }, [loadMessages, loadStats, loadWaStatus]);

  const handleUpdate = useCallback((updated) => {
    setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
    loadStats();
  }, [loadStats]);

  function showToast(title, body) {
    setToast({ title, body });
    setTimeout(() => setToast(null), 4000);
  }

  // Socket events (passed to SocketProvider above, but also handled here for UI)
  useEffect(() => {
    // Listen for new messages from socket
    const socket = socketCtx?.socket;
    if (!socket) return;

    const onNew = (msg) => {
      setMessages(prev => [msg, ...prev].slice(0, 500));
      loadStats();
      showToast(`New ${msg.category}: ${msg.sender}`, msg.message);
    };
    const onUpdated = (updated) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
    };

    socket.on('new_message', onNew);
    socket.on('message_updated', onUpdated);
    socket.on('initial_data', ({ messages: initMsgs }) => {
      setMessages(initMsgs || []);
    });
    socket.on('messages_cleared', () => {
      setMessages([]);
      loadStats();
    });
    socket.on('message_deleted', (deletedId) => {
      setMessages(prev => prev.filter(m => m.id !== deletedId));
      loadStats();
    });
    
    // WhatsApp Status Events
    socket.on('whatsapp_qr', () => setWaStatus('awaiting_qr'));
    socket.on('whatsapp_connected', () => {
      setWaStatus('ready');
      loadMessages();
    });
    socket.on('whatsapp_disconnected', () => setWaStatus('disconnected'));

    return () => {
      socket.off('new_message', onNew);
      socket.off('message_updated', onUpdated);
      socket.off('messages_cleared');
      socket.off('message_deleted');
      socket.off('whatsapp_qr');
      socket.off('whatsapp_connected');
      socket.off('whatsapp_disconnected');
    };
  }, [socketCtx?.socket, loadMessages, loadStats]);

  function navigate(page) {
    setActivePage(page);
    if (page !== 'search') setSearchVal('');
  }

  async function handleClearAll() {
    if (!window.confirm('Clear all demo data? Your real WhatsApp messages will still appear as they come in.')) return;
    setClearLoading(true);
    try {
      await api.clearMessages();
      setMessages([]);
      loadStats();
      showToast('✅ Cleared', 'Demo data removed. Real WhatsApp messages will appear live.');
    } catch (e) {
      showToast('⚠️ Error', 'Could not clear messages.');
    }
    setClearLoading(false);
  }

  async function handleLogout() {
    if (!window.confirm('Are you sure you want to log out of WhatsApp? You will need to scan a new QR code.')) return;
    setLogoutLoading(true);
    try {
      await api.logoutWhatsApp();
      showToast('Log Out', 'WhatsApp session has been disconnected.');
      // The socket logic mapping connected -> false via 'whatsapp_disconnected' handles the UI shift automatically
    } catch (e) {
      showToast('⚠️ Error', 'Failed to log out of WhatsApp.');
    }
    setLogoutLoading(false);
  }

  function handleHeaderSearch(e) {
    e.preventDefault();
    if (searchVal.trim()) navigate('search');
  }

  function renderPage() {
    if (!connected) return <WhatsAppLogin />;

    switch (activePage) {
      case 'dashboard':
        return <Dashboard messages={messages} stats={stats} onUpdate={handleUpdate} />;
      case 'study-materials':
        return <CategoryPage title="Study Materials" category="Study Materials" messages={messages} onUpdate={handleUpdate} />;
      case 'announcements':
        return <CategoryPage title="Announcements" category="Announcements" messages={messages} onUpdate={handleUpdate} />;
      case 'doubts':
        return <CategoryPage title="Doubts"        category="Doubts"        messages={messages} onUpdate={handleUpdate} />;
      case 'important':
        return <CategoryPage title="Important"     category="Important"     messages={messages} onUpdate={handleUpdate} />;
      case 'general':
        return <CategoryPage title="General Chat"  category="General"       messages={messages} onUpdate={handleUpdate} />;
      case 'search':
        return <SearchPage onUpdate={handleUpdate} />;
      default:
        return <Dashboard messages={messages} stats={stats} onUpdate={handleUpdate} />;
    }
  }

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        stats={stats}
        connected={connected}
      />

      <div className="main-content" style={{ flex: 1 }}>
        <div className="topbar">
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
              {PAGE_TITLES[activePage]}
            </h1>
          </div>

          <form onSubmit={handleHeaderSearch} style={{ position: 'relative', width: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="search-input"
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Quick search…"
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
            />
          </form>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            borderRadius: 8,
            background: connected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#22c55e' : '#ef4444',
              animation: connected ? 'pulse-green 2s infinite' : 'none'
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: connected ? '#15803d' : '#dc2626' }}>
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          <button
            onClick={handleClearAll}
            disabled={clearLoading}
            title="Clear all demo data"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 10,
              border: '1px solid #fecaca', background: '#fff5f5',
              cursor: clearLoading ? 'not-allowed' : 'pointer',
              color: '#dc2626', fontSize: 12, fontWeight: 600,
              opacity: clearLoading ? 0.6 : 1, transition: 'all 0.15s'
            }}
          >
            <Trash2 size={14} />
            {clearLoading ? 'Clearing…' : 'Clear Demo Data'}
          </button>

          {connected && (
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              title="Logout from WhatsApp"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10,
                border: '1px solid #e2e8f0', background: 'white',
                cursor: logoutLoading ? 'not-allowed' : 'pointer',
                color: '#64748b', fontSize: 13, fontWeight: 600,
                opacity: logoutLoading ? 0.6 : 1, transition: 'all 0.15s'
              }}
            >
              {logoutLoading ? 'Logging out...' : 'Logout WhatsApp'}
            </button>
          )}

          <button style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
            <Bell size={16} />
          </button>
        </div>

        <div className="page-content">
          {renderPage()}
        </div>
      </div>

      {toast && (
        <div className="toast-notification">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>💬</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{toast.title}</div>
            <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
              {toast.body}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AppInner />
    </SocketProvider>
  );
}
