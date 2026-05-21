import { X } from 'lucide-react';

export default function PreviewModal({ isOpen, onClose, url }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15,23,42,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, backdropFilter: 'blur(4px)'
    }}>
      <div className="glass modal-content" onClick={e => e.stopPropagation()} style={{
        padding: '1.5rem', borderRadius: 16,
        width: '85vw', height: '85vh', display: 'flex', flexDirection: 'column',
        maxWidth: '1200px', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ color: '#f1f5f9', fontWeight: 700, margin: 0 }}>Certificate Preview</h3>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ flex: 1, background: '#0f172a', borderRadius: 12, overflow: 'hidden' }}>
          <iframe src={url} style={{ width: '100%', height: '100%', border: 'none' }} title="Certificate Preview" />
        </div>
      </div>
    </div>
  );
}
