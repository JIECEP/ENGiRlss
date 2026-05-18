import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmText = "Confirm", danger = true }) {
  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-box" style={{ maxWidth: 400, textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem'
        }}>
          <AlertTriangle size={32} color={danger ? "#ef4444" : "#6366f1"} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </button>
          <button className={danger ? "btn-danger" : "btn-primary"} style={{ flex: 1 }} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
