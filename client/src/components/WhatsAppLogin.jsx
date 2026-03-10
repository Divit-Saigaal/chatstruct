import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, RefreshCw, X } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function WhatsAppLogin({ onClose }) {
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState('initializing');
  const socketCtx = useSocket();

  useEffect(() => {
    api.getWhatsAppInfo()
      .then(res => {
        if (res.qr) setQrCode(res.qr);
        if (res.status) setStatus(res.status);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const socket = socketCtx?.socket;
    if (!socket) return;

    const onQr = (qr) => { setQrCode(qr); setStatus('awaiting_qr'); };
    const onConnected = () => { if (onClose) onClose(); };

    socket.on('whatsapp_qr', onQr);
    socket.on('whatsapp_connected', onConnected);

    return () => {
      socket.off('whatsapp_qr', onQr);
      socket.off('whatsapp_connected', onConnected);
    };
  }, [socketCtx?.socket, onClose]);

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Smartphone size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>Link WhatsApp Device</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Scan the QR code with your phone</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* QR Code Box */}
      <div style={{
        background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 220, marginBottom: 20
      }}>
        {qrCode ? (
          <QRCodeSVG value={qrCode} size={180} level="M" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#94a3b8', gap: 10 }}>
            <RefreshCw size={22} style={{ animation: 'spin 1.5s linear infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>
              {status === 'initializing' ? 'Generating QR code...' : 'Waiting for WhatsApp...'}
            </span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ background: '#f1f5f9', borderRadius: 12, padding: '14px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 8px' }}>Instructions</p>
        <ol style={{ paddingLeft: 18, margin: 0, fontSize: 13, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Open <strong>WhatsApp</strong> on your phone</li>
          <li>Tap <strong>Menu</strong> → <strong>Linked Devices</strong></li>
          <li>Tap <strong>Link a Device</strong> and scan above</li>
        </ol>
      </div>
    </div>
  );
}
