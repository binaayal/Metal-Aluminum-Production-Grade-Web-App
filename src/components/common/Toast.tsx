import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toast, onClose]);

  if (!toast) return null;

  const bgMap = {
    success: 'rgba(16, 185, 129, 0.15)',
    error: 'rgba(244, 63, 94, 0.15)',
    info: 'rgba(56, 189, 248, 0.15)'
  };

  const borderMap = {
    success: 'rgba(16, 185, 129, 0.4)',
    error: 'rgba(244, 63, 94, 0.4)',
    info: 'rgba(56, 189, 248, 0.4)'
  };

  const iconMap = {
    success: <CheckCircle size={20} color="#34d399" />,
    error: <AlertTriangle size={20} color="#f87171" />,
    info: <Info size={20} color="#38bdf8" />
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 200,
        backgroundColor: bgMap[toast.type],
        border: `1px solid ${borderMap[toast.type]}`,
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.25rem',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-lg)',
        maxWidth: '400px',
        animation: 'slideUp 0.2s ease-out'
      }}
    >
      {iconMap[toast.type]}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{toast.title}</div>
        {toast.message && <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{toast.message}</div>}
      </div>
      <button onClick={onClose} className="btn btn-ghost" style={{ padding: 0, marginLeft: '0.5rem' }}>
        <X size={16} />
      </button>
    </div>
  );
};
