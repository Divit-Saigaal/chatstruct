import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function WhatsAppLogin() {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('initializing');
  const socketCtx = useSocket();

  useEffect(() => {
    // 1. Fetch initial QR on mount in case it was already generated before we connected
    api.getWhatsAppInfo()
      .then(res => {
        if (res.qr) setQrCode(res.qr);
        if (res.status) setStatus(res.status);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // 2. Listen for socket updates
    const socket = socketCtx?.socket;
    if (!socket) return;

    const onQr = (qr) => {
      setQrCode(qr);
      setStatus('awaiting_qr');
    };

    socket.on('whatsapp_qr', onQr);

    return () => {
      socket.off('whatsapp_qr', onQr);
    };
  }, [socketCtx?.socket]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', padding: 20
    }}>
      <div style={{
        background: 'white', padding: 40, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
        maxWidth: 400, width: '100%', textAlign: 'center'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
        }}>
          <Smartphone size={28} />
        </div>
        
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
          Link WhatsApp Device
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
          Open WhatsApp on your phone and link this browser session to start organizing your chats.
        </p>

        <div style={{
          background: '#f8fafc', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 250, marginBottom: 24
        }}>
          {qrCode ? (
            <QRCodeSVG value={qrCode} size={200} level="M" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8', gap: 12 }}>
              <RefreshCw className="spinner" size={24} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {status === 'initializing' ? 'Generating Code...' : 'Waiting for WhatsApp...'}
              </span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Instructions
          </h3>
          <ol style={{ paddingLeft: 16, margin: 0, fontSize: 14, color: '#475569', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <li>Open WhatsApp on your phone</li>
            <li>Tap <strong>Menu</strong> or <strong>Settings</strong></li>
            <li>Select <strong>Linked Devices</strong></li>
            <li>Tap <strong>Link a Device</strong> and point your camera here</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
