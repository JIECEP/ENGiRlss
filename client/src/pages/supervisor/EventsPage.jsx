import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { CalendarDays, Plus, X, Users, CheckCircle, Clock, FileText, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';

function CreateEventModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return toast.error('Title and date are required.');
    setCreating(true);
    try {
      await onCreate({ title: title.trim(), description: description.trim(), date });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.125rem' }}>Create New Event</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Event Title *</label>
            <input className="input-field" placeholder="e.g., Annual Training Workshop 2026" value={title} onChange={e => setTitle(e.target.value)} autoFocus id="event-title-input" />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="label">Description</label>
            <textarea className="input-field" placeholder="Optional event description..." value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} id="event-desc-input" />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="label">Event Date *</label>
            <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} id="event-date-input" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={creating}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={creating} id="event-create-btn">
              {creating ? <><div className="spinner" /> Creating...</> : <><Plus size={16} /> Create Event</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getStatusBadge(status) {
  switch (status) {
    case 'sent':
      return <span className="badge badge-success"><CheckCircle size={11} /> Sent</span>;
    case 'generated':
      return <span className="badge badge-primary"><FileText size={11} /> Generated</span>;
    default:
      return <span className="badge badge-warning"><Clock size={11} /> Draft</span>;
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data.events || []);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (eventData) => {
    try {
      const { data } = await api.post('/events', eventData);
      toast.success('Event created!');
      setShowCreate(false);
      navigate(`/supervisor/events/${data.event._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    try {
      await api.delete(`/events/${eventToDelete._id}`);
      toast.success('Event deleted.');
      fetchEvents();
    } catch { toast.error('Failed to delete event'); }
    finally { setEventToDelete(null); }
  };

  return (
    <DashboardLayout title="Events" subtitle="Create and manage certificate events">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CalendarDays size={20} color="#6366f1" />
          <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '1.0625rem' }}>
            {events.length} Event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} id="create-event-btn">
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Events grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.25rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="glass" style={{ borderRadius: 16, padding: '4rem 2rem', textAlign: 'center' }}>
          <CalendarDays size={56} style={{ margin: '0 auto 1.25rem', opacity: 0.2, color: '#6366f1' }} />
          <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '1.0625rem', marginBottom: '0.5rem' }}>No events yet</p>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Create your first event to start generating certificates.</p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create Event
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '1.25rem' }}>
          {events.map(event => (
            <div key={event._id} className="glass card-hover" style={{
              borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
              border: '1px solid rgba(99,102,241,0.1)', transition: 'all 0.2s'
            }} onClick={() => navigate(`/supervisor/events/${event._id}`)}>
              {/* Card header gradient */}
              <div style={{
                padding: '1.25rem 1.5rem',
                background: event.status === 'sent'
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'
                  : event.status === 'generated'
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'
                  : 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
                borderBottom: '1px solid rgba(99,102,241,0.08)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.0625rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.375rem' }}>
                      <CalendarDays size={13} color="#64748b" />
                      <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                        {format(new Date(event.date), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '1rem 1.5rem' }}>
                {event.description && (
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Users size={14} color="#818cf8" />
                    <span style={{ fontSize: '0.8125rem', color: '#e2e8f0', fontWeight: 600 }}>
                      {event.totalCerts || 0}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>recipients</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <CheckCircle size={14} color="#10b981" />
                    <span style={{ fontSize: '0.8125rem', color: '#e2e8f0', fontWeight: 600 }}>
                      {event.sentCerts || 0}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>sent</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn-danger" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                    onClick={(e) => { e.stopPropagation(); setEventToDelete(event); }}>
                    <Trash2 size={12} />
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: '#818cf8', fontWeight: 500 }}>
                    Open <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateEventModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {eventToDelete && (
        <ConfirmModal
          title="Delete Event"
          message={`Are you sure you want to delete "${eventToDelete.title}"? All associated certificates will be permanently deleted.`}
          confirmText="Yes, Delete Event"
          onConfirm={handleDelete}
          onCancel={() => setEventToDelete(null)}
        />
      )}
    </DashboardLayout>
  );
}
