import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Users, CalendarDays, Award, Mail, TrendingUp, Activity, ShieldCheck, FileText } from 'lucide-react';
import { format } from 'date-fns';

function StatCard({ icon: Icon, label, value, color, gradient, sub, to }) {
  const content = (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', height: '100%' }}>
      <div>
        <p style={{ fontSize:'0.8125rem', color:'var(--text-muted)', fontWeight:500, marginBottom:'0.5rem' }}>{label}</p>
        <p style={{ fontSize:'2rem', fontWeight:800, color:'var(--text-title)', lineHeight:1 }}>{value ?? '—'}</p>
        {sub && <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:'0.375rem' }}>{sub}</p>}
      </div>
      <div style={{
        width:48, height:48, borderRadius:12,
        background: color, display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0
      }}>
        <Icon size={22} color="white" />
      </div>
    </div>
  );

  const style = {
    background: gradient || 'var(--bg-surface)',
    textDecoration: 'none',
    display: 'block',
    height: '100%'
  };

  if (to) {
    return (
      <Link to={to} className="stat-card card-hover" style={style}>
        {content}
      </Link>
    );
  }

  return (
    <div className="stat-card card-hover" style={{ background: gradient || 'var(--bg-surface)' }}>
      {content}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users:0, templates:0, certs:0, sentCerts:0, pendingCerts:0 });
  const [recentTemplates, setRecentTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, templatesRes, certsRes] = await Promise.all([
          api.get('/users'),
          api.get('/templates'),
          api.get('/certificates/stats'),
        ]);
        setStats({
          users: usersRes.data.users?.length || 0,
          templates: templatesRes.data.templates?.length || 0,
          certs: certsRes.data.stats?.totalCerts || 0,
          sentCerts: certsRes.data.stats?.sentCerts || 0,
          pendingCerts: certsRes.data.stats?.pendingCerts || 0,
          emailTemplates: certsRes.data.stats?.totalEmailTemplates || 0,
        });
        setRecentTemplates((templatesRes.data.templates || []).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="System overview and monitoring">
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:'1.25rem', marginBottom:'2rem' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height:120, borderRadius:16 }} />)}
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1.25rem', marginBottom:'2rem' }}>
            <StatCard icon={Users} label="Total Supervisors" value={stats.users} color="rgba(99,102,241,0.7)" sub="System users" to="/admin/supervisors" />
            <StatCard icon={CalendarDays} label="Total Certificate Template" value={stats.templates} color="rgba(14,165,233,0.7)" sub="Uploaded backgrounds" to="/admin/certificates" />
            <StatCard icon={FileText} label="Total Email Template" value={stats.emailTemplates} color="rgba(139,92,246,0.7)" sub="Reusable emails" to="/supervisor/email-templates" />
            <StatCard icon={Award} label="Certificates Generated" value={stats.certs} color="rgba(245,158,11,0.7)" sub="All time" to="/admin/repository" />
            <StatCard icon={Mail} label="Emails Sent" value={stats.sentCerts} color="rgba(16,185,129,0.7)" sub={`${stats.pendingCerts} pending`} to="/admin/repository" />
          </div>

          {/* Overview Grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.5rem' }}>
            {/* Recent Templates */}
            <div className="glass" style={{ borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border-color)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <Activity size={18} color="#6366f1" />
                <span style={{ fontWeight:600, color:'var(--text-title)' }}>Recent Templates</span>
              </div>
              {recentTemplates.length === 0 ? (
                <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:'0.875rem' }}>No templates yet</div>
              ) : (
                <div className="table-container" style={{ border:'none', borderRadius:0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Template Name</th>
                        <th>Uploaded By</th>
                        <th>Created</th>
                        <th>Font Config</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTemplates.map(tmpl => (
                        <tr key={tmpl._id}>
                          <td style={{ fontWeight:500, color:'var(--text-main)' }}>{tmpl.originalName}</td>
                          <td style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>{tmpl.uploadedBy?.name || 'N/A'}</td>
                          <td>{format(new Date(tmpl.createdAt), 'MMM d, yyyy')}</td>
                          <td>
                            <span className="badge badge-primary">{tmpl.fontFamily} - {tmpl.fontSize}pt</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Stats side panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
                  <TrendingUp size={18} color="#6366f1" />
                  <span style={{ fontWeight:600, color:'var(--text-title)' }}>Email Performance</span>
                </div>
                <div style={{ marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.375rem' }}>
                    <span style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>Delivery Rate</span>
                    <span style={{ fontSize:'0.8125rem', fontWeight:700, color:'#34d399' }}>
                      {stats.certs > 0 ? Math.round((stats.sentCerts / stats.certs) * 100) : 0}%
                    </span>
                  </div>
                  <div style={{ height:8, background:'var(--bg-surface)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:4,
                      background:'linear-gradient(90deg, #10b981, #34d399)',
                      width: `${stats.certs > 0 ? Math.round((stats.sentCerts / stats.certs) * 100) : 0}%`,
                      transition:'width 0.8s ease'
                    }} />
                  </div>
                </div>
                <div style={{ display:'flex', gap:'1rem' }}>
                  <div style={{ flex:1, textAlign:'center', padding:'0.75rem', background:'rgba(16,185,129,0.1)', borderRadius:8 }}>
                    <div style={{ fontWeight:700, color:'#34d399', fontSize:'1.25rem' }}>{stats.sentCerts}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Sent</div>
                  </div>
                  <div style={{ flex:1, textAlign:'center', padding:'0.75rem', background:'rgba(245,158,11,0.1)', borderRadius:8 }}>
                    <div style={{ fontWeight:700, color:'#fbbf24', fontSize:'1.25rem' }}>{stats.pendingCerts}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Pending</div>
                  </div>
                </div>
              </div>

              <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
                  <ShieldCheck size={18} color="#6366f1" />
                  <span style={{ fontWeight:600, color:'var(--text-title)' }}>System Status</span>
                </div>
                {[
                  { label:'API Server', status:'Online', color:'#34d399' },
                  { label:'Database', status:'Connected', color:'#34d399' },
                  { label:'File Storage', status:'Active', color:'#34d399' },
                  { label:'Email Service', status:'Configured', color:'#fbbf24' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.625rem' }}>
                    <span style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize:'0.75rem', fontWeight:600, color:item.color }}>● {item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
