import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Award, CheckCircle, AlertCircle, User, Mail, BookOpen, Hash } from 'lucide-react';

export default function RegisterPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName:'', email:'', course:'', section:'' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/events/${eventId}`)
      .then(r => setEvent(r.data.event))
      .catch(() => setError('Event not found or registration is closed.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/participants/register', { eventId, ...form });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a' }}>
      <div className="spinner" style={{ width:40, height:40, borderWidth:3 }} />
    </div>
  );

  return (
    <div style={{
      minHeight:'100vh', background:'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem', position:'relative', overflow:'hidden'
    }}>
      <div style={{
        position:'absolute', width:500, height:500, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        top:'-150px', right:'-100px', pointerEvents:'none'
      }} />

      <div style={{ width:'100%', maxWidth:520 }} className="animate-slide-up">
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{
            width:64, height:64, borderRadius:18, margin:'0 auto 1rem',
            background:'linear-gradient(135deg,#6366f1,#0ea5e9)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 8px 32px rgba(99,102,241,0.4)'
          }}>
            <Award size={32} color="white" />
          </div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800, color:'#f1f5f9', marginBottom:'0.375rem' }}>Registration Form</h1>
          {event && (
            <p style={{ fontSize:'0.9rem', color:'#818cf8', fontWeight:500 }}>{event.title}</p>
          )}
        </div>

        <div className="glass" style={{ borderRadius:20, padding:'2.5rem', boxShadow:'0 20px 60px rgba(0,0,0,0.4)' }}>
          {error && !event ? (
            <div style={{ textAlign:'center', padding:'1.5rem' }}>
              <AlertCircle size={40} color="#f87171" style={{ margin:'0 auto 1rem' }} />
              <p style={{ color:'#f87171', fontSize:'0.9375rem' }}>{error}</p>
            </div>
          ) : success ? (
            <div style={{ textAlign:'center', padding:'1.5rem' }} className="animate-fade-in">
              <CheckCircle size={56} color="#34d399" style={{ margin:'0 auto 1.25rem' }} />
              <h2 style={{ fontSize:'1.375rem', fontWeight:700, color:'#f1f5f9', marginBottom:'0.625rem' }}>
                Registration Successful!
              </h2>
              <p style={{ color:'#94a3b8', fontSize:'0.9rem', marginBottom:'0.5rem' }}>
                Thank you, <strong style={{ color:'#e2e8f0' }}>{form.fullName}</strong>!
              </p>
              <p style={{ color:'#64748b', fontSize:'0.8125rem' }}>
                Your certificate will be sent to <strong style={{ color:'#94a3b8' }}>{form.email}</strong> after the event.
              </p>
              {event && (
                <div style={{ marginTop:'1.5rem', padding:'1rem', background:'rgba(99,102,241,0.08)', borderRadius:10, border:'1px solid rgba(99,102,241,0.2)' }}>
                  <p style={{ fontSize:'0.8125rem', color:'#94a3b8' }}>
                    <strong style={{ color:'#818cf8' }}>Event:</strong> {event.title}<br/>
                    <strong style={{ color:'#818cf8' }}>Date:</strong> {new Date(event.date).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}<br/>
                    <strong style={{ color:'#818cf8' }}>Organizer:</strong> {event.organizer}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {event && (
                <div style={{ padding:'1rem', background:'rgba(99,102,241,0.08)', borderRadius:10, border:'1px solid rgba(99,102,241,0.15)', marginBottom:'1.75rem' }}>
                  <h2 style={{ fontWeight:700, color:'#818cf8', fontSize:'1.0625rem', marginBottom:'0.25rem' }}>{event.title}</h2>
                  <p style={{ fontSize:'0.8rem', color:'#64748b' }}>
                    📅 {new Date(event.date).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })} &nbsp;·&nbsp; 🏢 {event.organizer}
                  </p>
                  {event.description && <p style={{ fontSize:'0.8125rem', color:'#94a3b8', marginTop:'0.5rem' }}>{event.description}</p>}
                </div>
              )}

              {error && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'0.75rem 1rem', marginBottom:'1.25rem' }}>
                  <AlertCircle size={16} color="#f87171" />
                  <span style={{ fontSize:'0.8125rem', color:'#f87171' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom:'1.125rem' }}>
                  <label className="label">Full Name *</label>
                  <div style={{ position:'relative' }}>
                    <User size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
                    <input id="reg-name" className="input-field" style={{ paddingLeft:'2.5rem' }} placeholder="Juan Dela Cruz"
                      value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})} required />
                  </div>
                </div>
                <div style={{ marginBottom:'1.125rem' }}>
                  <label className="label">Email Address *</label>
                  <div style={{ position:'relative' }}>
                    <Mail size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
                    <input id="reg-email" className="input-field" type="email" style={{ paddingLeft:'2.5rem' }} placeholder="juan@email.com"
                      value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.75rem' }}>
                  <div>
                    <label className="label">Course / Department</label>
                    <div style={{ position:'relative' }}>
                      <BookOpen size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
                      <input id="reg-course" className="input-field" style={{ paddingLeft:'2.5rem' }} placeholder="BSIT"
                        value={form.course} onChange={e => setForm({...form, course:e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Section</label>
                    <div style={{ position:'relative' }}>
                      <Hash size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
                      <input id="reg-section" className="input-field" style={{ paddingLeft:'2.5rem' }} placeholder="A1"
                        value={form.section} onChange={e => setForm({...form, section:e.target.value})} />
                    </div>
                  </div>
                </div>
                <button id="reg-submit" type="submit" className="btn-primary" disabled={submitting}
                  style={{ width:'100%', justifyContent:'center', padding:'0.875rem', fontSize:'0.9375rem' }}>
                  {submitting ? <><div className="spinner" /> Submitting...</> : 'Submit Registration'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
