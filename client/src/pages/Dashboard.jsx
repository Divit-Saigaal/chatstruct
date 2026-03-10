/**
 * Dashboard Page — Home with widgets for all categories
 */
import { useEffect, useState } from 'react';
import { Megaphone, AlertTriangle, HelpCircle, BookOpen, TrendingUp, Users, MessageSquare, Zap } from 'lucide-react';
import MessageCard from '../components/MessageCard';
import SummaryCard from '../components/SummaryCard';
import UpcomingEvents from '../components/UpcomingEvents';
import { api } from '../services/api';

function StatCard({ icon, label, value, color, bgColor }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bgColor }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function MessageSection({ title, emoji, messages, onUpdate, accent }) {
  if (!messages?.length) return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <div className="section-header">
        <h3 className="section-title">
          <span>{emoji}</span>
          {title}
          <span style={{ background: accent, color: 'white', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
            {messages.length}
          </span>
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
        {messages.slice(0, 4).map(m => (
          <MessageCard key={m.id} msg={m} onUpdate={onUpdate} />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ messages, stats, onUpdate }) {
  const [summary, setSummary] = useState(null);
  const [chats, setChats]     = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    api.getChats().then(c => {
      setChats(c);
      if (c.length > 0) setActiveChat(c[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeChat) {
      api.getSummary(activeChat).then(setSummary).catch(() => {});
    }
  }, [activeChat, messages]);

  const announcements = messages.filter(m => m.category === 'Announcements');
  const important     = messages.filter(m => m.category === 'Important');
  const doubts        = messages.filter(m => m.category === 'Doubts');
  const studyMaterials= messages.filter(m => m.category === 'Study Materials');

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 32 }}>
        <StatCard icon={<MessageSquare size={22} color="#6366f1" />} label="Total Messages"  value={stats?.total || 0}         bgColor="#ede9fe" />
        <StatCard icon={<Megaphone    size={22} color="#10b981" />} label="Announcements"   value={stats?.announcements || 0}  bgColor="#d1fae5" />
        <StatCard icon={<AlertTriangle size={22} color="#f59e0b" />} label="Important"       value={stats?.important || 0}      bgColor="#fef3c7" />
        <StatCard icon={<HelpCircle   size={22} color="#3b82f6" />} label="Doubts"           value={stats?.doubts || 0}         bgColor="#dbeafe" />
        <StatCard icon={<BookOpen     size={22} color="#8b5cf6" />} label="Study Materials"  value={stats?.studyMaterials || 0} bgColor="#ede9fe" />
        <StatCard icon={<Users        size={22} color="#06b6d4" />} label="Active Groups"    value={stats?.groups || 0}         bgColor="#cffafe" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28 }}>
        {/* Left: message sections */}
        <div>
          <MessageSection title="Announcements"    emoji="📢" messages={announcements} onUpdate={onUpdate} accent="#10b981" />
          <MessageSection title="Important"         emoji="🔴" messages={important}     onUpdate={onUpdate} accent="#f59e0b" />
          <MessageSection title="Doubts & Questions" emoji="❓" messages={doubts}       onUpdate={onUpdate} accent="#3b82f6" />
          <MessageSection title="Study Materials"     emoji="📚" messages={studyMaterials} onUpdate={onUpdate} accent="#8b5cf6" />
          {announcements.length + important.length + doubts.length + studyMaterials.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📱</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No messages yet</div>
              <div style={{ fontSize: 14 }}>Connect your WhatsApp and start scanning messages!</div>
            </div>
          )}

          <UpcomingEvents />
        </div>

        {/* Right: summary card */}
        <div>
          <div style={{ marginBottom: 14 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>
              <Zap size={16} color="#6366f1" /> Group Summary
            </div>
            {chats.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                {chats.map(c => (
                  <button
                    key={c}
                    onClick={() => setActiveChat(c)}
                    className={`filter-chip ${activeChat === c ? 'active' : ''}`}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    {c.length > 20 ? c.slice(0, 20) + '…' : c}
                  </button>
                ))}
              </div>
            )}
          </div>
          <SummaryCard summary={summary} />
        </div>
      </div>
    </div>
  );
}
