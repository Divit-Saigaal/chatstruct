/**
 * Category Page — reusable page for Notes / Announcements / Doubts / Important / General
 */
import { useState } from 'react';
import MessageCard from '../components/MessageCard';
import { getCategoryIcon } from '../utils/helpers';

export default function CategoryPage({ title, category, messages, onUpdate }) {
  const [chatFilter, setChatFilter] = useState('All');
  const [tagFilter,  setTagFilter]  = useState('All');

  const filtered = messages
    .filter(m => m.category === category)
    .filter(m => chatFilter === 'All' || m.chat === chatFilter)
    .filter(m => tagFilter  === 'All' || m.tags.includes(tagFilter));

  // Build unique lists for filters
  const chats = ['All', ...new Set(messages.filter(m => m.category === category).map(m => m.chat))];
  const tags  = ['All', ...new Set(messages.filter(m => m.category === category).flatMap(m => m.tags))];

  const icon = getCategoryIcon(category);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 26 }}>{icon}</span> {title}
          <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '2px 10px', borderRadius: 10 }}>
            {filtered.length}
          </span>
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          All messages classified as <strong>{category}</strong>.
        </p>
      </div>

      {/* Filters */}
      {(chats.length > 1 || tags.length > 1) && (
        <div style={{ marginBottom: 20 }}>
          {chats.length > 1 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Filter by Group
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {chats.map(c => (
                  <button key={c} onClick={() => setChatFilter(c)} className={`filter-chip ${chatFilter === c ? 'active' : ''}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tags.length > 1 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Filter by Tag
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tags.map(t => (
                  <button key={t} onClick={() => setTagFilter(t)} className={`filter-chip ${tagFilter === t ? 'active' : ''}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No {title} yet</div>
          <div style={{ fontSize: 14 }}>Messages classified as "{category}" will appear here.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {filtered.map(m => (
            <MessageCard key={m.id} msg={m} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}
