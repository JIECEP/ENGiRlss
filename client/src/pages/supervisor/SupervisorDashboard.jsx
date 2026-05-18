import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { CalendarDays, Award, Image, TrendingUp, Mail, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <div className="stat-card card-hover" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <p style={{ fontSize:'0.8125rem', color:'#94a3b8', fontWeight:500, marginBottom:'0.5rem' }}>{label}</p>
          <p style={{ fontSize:'2rem', fontWeight:800, color:'#f1f5f9', lineHeight:1 }}>{value ?? '—'}</p>
        </div>
        <div style={{ width:48, height:48, borderRadius:12, background:color, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={22} color="white" />
        </div>
      </div>
    </div>
  );
}

export default function SupervisorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events:0, templates:0, certs:0, sent:0, pending:0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, certsRes, eventsRes, emailTemplatesRes] = await Promise.all([
          api.get('/templates'),
          api.get('/certificates/stats'),
          api.get('/events'),
          api.get('/email-templates'),
        ]);
        const events = eventsRes.data.events || [];
        setStats({
          events: events.length,
          templates: templatesRes.data.templates?.length || 0,
          certs: certsRes.data.stats?.totalCerts || 0,
          sent: certsRes.data.stats?.sentCerts || 0,
          pending: certsRes.data.stats?.pendingCerts || 0,
          emailTemplates: emailTemplatesRes.data.templates?.length || 0,
        });
        setRecentEvents(events.slice(0, 4));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout title={`Welcome, ${user?.name}!`} subtitle="Manage your events and certificates">
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1.25rem', marginBottom:'2rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height:110, borderRadius:16 }} />)}
        </div>
      ) : (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1.25rem', marginBottom:'2rem' }}>
            <StatCard icon={CalendarDays} label="Events" value={stats.events} color="rgba(168,85,247,0.7)" onClick={() => navigate('/supervisor/events')} />
            <StatCard icon={Image} label="Certificate Template" value={stats.templates} color="rgba(14,165,233,0.7)" onClick={() => navigate('/supervisor/templates')} />
            <StatCard icon={Mail} label="Email Template" value={stats.emailTemplates} color="rgba(245,158,11,0.7)" onClick={() => navigate('/supervisor/email-templates')} />
            <StatCard icon={TrendingUp} label="Emails Sent" value={stats.sent} color="rgba(16,185,129,0.7)" />
            <StatCard icon={Clock} label="Pending" value={stats.pending} color="rgba(99,102,241,0.7)" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'1.5rem' }}>
            {/* Recent Certificates list */}
            <div className="glass" style={{ borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid rgba(99,102,241,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  <CalendarDays size={18} color="#6366f1" />
                  <span style={{ fontWeight:600, color:'#f1f5f9' }}>Recent Events</span>
                </div>
                <button className="btn-primary" onClick={() => navigate('/supervisor/events')} style={{ padding:'0.375rem 0.875rem', fontSize:'0.75rem' }}>
                  View All
                </button>
              </div>
              {recentEvents.length === 0 ? (
                <div style={{ padding:'2.5rem', textAlign:'center', color:'#64748b' }}>
                  <CalendarDays size={36} style={{ margin:'0 auto 0.75rem', opacity:0.3 }} />
                  <p style={{ fontSize:'0.875rem' }}>No events created yet.</p>
                </div>
              ) : (
                <div style={{ padding:'0.5rem' }}>
                  {recentEvents.map(ev => (
                    <div key={ev._id} style={{
                      padding:'1rem', borderRadius:10, display:'flex', gap:'1rem',
                      alignItems:'center', transition:'background 0.15s',
                      cursor:'pointer', marginBottom:'0.25rem'
                    }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      onClick={() => navigate(`/supervisor/events/${ev._id}`)}
                    >
                      <div style={{
                        width:42, height:42, borderRadius:10, flexShrink:0,
                        background:'linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.2))',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'#a855f7', fontWeight:700, fontSize:'0.875rem'
                      }}>
                        {ev.title?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, color:'#e2e8f0', fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {ev.title}
                        </div>
                        <div style={{ fontSize:'0.75rem', color:'#64748b', display:'flex', alignItems:'center', gap:'0.375rem', marginTop:'0.125rem' }}>
                          <Clock size={11} />
                          {format(new Date(ev.date), 'MMMM d, yyyy')} · {ev.totalCerts || 0} certs
                        </div>
                      </div>
                      <span className={`badge ${ev.status === 'sent' ? 'badge-success' : ev.status === 'generated' ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize:'0.65rem' }}>
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Workflow guide */}
            <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
                <TrendingUp size={18} color="#6366f1" />
                <span style={{ fontWeight:600, color:'#f1f5f9', fontSize:'0.9375rem' }}>Workflow Guide</span>
              </div>
              {[
                { step:1, text:'Create an Event', done: stats.events > 0 },
                { step:2, text:'Upload Certificate Template', done: stats.templates > 0 },
                { step:3, text:'Upload Email Template', done: stats.emailTemplates > 0 },
                { step:4, text:'Upload Recipients (CSV)', done: stats.certs > 0 },
                { step:5, text:'Generate Certificates', done: stats.certs > 0 },
                { step:6, text:'Preview & Review', done: stats.certs > 0 },
                { step:7, text:'Send Emails', done: stats.sent > 0 },
              ].map(item => (
                <div key={item.step} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.875rem' }}>
                  <div style={{
                    width:26, height:26, borderRadius:'50%', flexShrink:0,
                    background: item.done ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.1)',
                    border: `1px solid ${item.done ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.2)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'0.7rem', fontWeight:700,
                    color: item.done ? '#34d399' : '#818cf8'
                  }}>
                    {item.done ? '✓' : item.step}
                  </div>
                  <span style={{ fontSize:'0.8125rem', color: item.done ? '#94a3b8' : '#e2e8f0' }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
