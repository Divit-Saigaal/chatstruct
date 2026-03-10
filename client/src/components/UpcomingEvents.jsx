import { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const socketCtx = useSocket();

  const loadEvents = () => {
    api.getEvents().then(setEvents).catch(() => {});
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Refresh events when a new message arrives (it might contain a new event)
  useEffect(() => {
    const socket = socketCtx?.socket;
    if (!socket) return;
    
    const onNew = () => loadEvents();
    socket.on('new_message', onNew);
    socket.on('messages_cleared', onNew);
    
    return () => {
      socket.off('new_message', onNew);
      socket.off('messages_cleared', onNew);
    };
  }, [socketCtx?.socket]);

  if (!events || events.length === 0) {
    return (
      <div style={{ marginTop: 32 }}>
        <div className="section-header">
          <h3 className="section-title">
            <Calendar size={20} color="#6366f1" />
            Upcoming Events
          </h3>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', background: 'white', borderRadius: 16, border: '1px solid #f1f5f9' }}>
          No upcoming events detected.
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div className="section-header">
        <h3 className="section-title">
          <Calendar size={20} color="#6366f1" />
          Upcoming Events
        </h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {events.map(ev => (
          <div key={ev.id} className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 8 }}>
              📅 {ev.title}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', fontWeight: 500 }}>
                <Clock size={14} color="#6366f1" />
                <span style={{ color: '#0f172a' }}>{ev.date}</span>
                {ev.time && ev.time !== 'TBD' && <span> at {ev.time}</span>}
              </div>
              
              {ev.location && ev.location !== 'TBD' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                  <MapPin size={14} color="#f43f5e" />
                  {ev.location}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
