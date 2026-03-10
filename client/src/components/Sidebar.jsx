/**
 * Sidebar component — always-visible navigation
 */
import { LayoutDashboard, BookOpen, Megaphone, HelpCircle, AlertTriangle, Search, Zap, MessageSquare } from 'lucide-react';

const navItems = [
  { id: 'dashboard',     label: 'Dashboard',         icon: LayoutDashboard, category: null          },
  { id: 'study-materials', label: 'Study Materials',   icon: BookOpen,        category: 'Study Materials' },
  { id: 'announcements', label: 'Announcements',      icon: Megaphone,       category: 'Announcements' },
  { id: 'doubts',        label: 'Doubts',             icon: HelpCircle,      category: 'Doubts'      },
  { id: 'important',     label: 'Important',          icon: AlertTriangle,   category: 'Important'   },
  { id: 'general',       label: 'General Chat',       icon: MessageSquare,   category: 'General'     },
  { id: 'search',        label: 'Search',             icon: Search,          category: null          },
];

export default function Sidebar({ activePage, onNavigate, stats, connected }) {
  const getCategoryCount = (category) => {
    if (!stats || !category) return null;
    const map = {
      'Study Materials': stats.studyMaterials,
      Announcements: stats.announcements,
      Doubts: stats.doubts,
      Important: stats.important,
      General: stats.general,
    };
    return map[category] ?? null;
  };

  return (
    <div className="sidebar">
      {/* Logo / Brand */}
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0
          }}>
            💬
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '18px', color: '#f8fafc', letterSpacing: '-0.5px' }}>
              ChatStruct
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              WhatsApp Organizer
            </div>
          </div>
        </div>
      </div>

      {/* Connection status */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: '8px',
          background: connected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${connected ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: connected ? '#22c55e' : '#ef4444',
            animation: connected ? 'pulse-green 2s infinite' : 'none'
          }} />
          <span style={{ fontSize: '12px', color: connected ? '#86efac' : '#fca5a5', fontWeight: 500 }}>
            {connected ? 'Live Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1 }}>
        <div style={{ padding: '0 8px 8px', fontSize: '11px', fontWeight: 600, color: '#475569', letterSpacing: '0.8px', textTransform: 'uppercase', marginLeft: 8 }}>
          Navigation
        </div>
        {navItems.map(item => {
          const Icon  = item.icon;
          const count = getCategoryCount(item.category);
          const isActive = activePage === item.id;

          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
              {count !== null && count > 0 && (
                <span className="count-badge">{count}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={14} color="#6366f1" />
          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 500 }}>
            {stats?.total || 0} messages processed
          </span>
        </div>
      </div>
    </div>
  );
}
