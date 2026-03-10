/**
 * Search Page — full-text and tag-based search
 */
import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import MessageCard from '../components/MessageCard';
import { api } from '../services/api';

export default function SearchPage({ onUpdate }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const data = await api.getMessages({ search: q });
      setResults(data);
      setSearched(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (e.target.value.length >= 2 || e.target.value.length === 0) {
      handleSearch(e.target.value);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
          🔍 Search Messages
        </h2>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Search by keyword, sender, tag, or group name.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', maxWidth: 640, marginBottom: 28 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          className="search-input"
          value={query}
          onChange={handleChange}
          placeholder="Type to search messages, senders, tags…"
          autoFocus
        />
      </div>

      {/* Quick tag buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {['#Assignment', '#Exam', '#Project', '#Reminder', '#StudyMaterial', '#Important'].map(tag => (
          <button
            key={tag}
            onClick={() => { setQuery(tag); handleSearch(tag); }}
            className={`filter-chip ${query === tag ? 'active' : ''}`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
          <div style={{ fontSize: 14 }}>Searching…</div>
        </div>
      )}

      {!loading && searched && (
        <div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
            Found <strong style={{ color: '#1e293b' }}>{results.length}</strong> result{results.length !== 1 ? 's' : ''} for "<em>{query}</em>"
          </div>
          {results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>😶</div>
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No results found</div>
              <div style={{ fontSize: 14 }}>Try a different keyword or tag.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              {results.map(m => (
                <MessageCard key={m.id} msg={m} onUpdate={onUpdate} />
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && !searched && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14 }}>Start typing to search through all your WhatsApp messages.</div>
        </div>
      )}
    </div>
  );
}
