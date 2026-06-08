import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Award, Download, Search, Mail, CheckCircle, Clock, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  const fetchCerts = async () => {
    try {
      const params = new URLSearchParams();
      if (filterEvent) params.set('eventId', filterEvent);
      if (search) params.set('search', search);
      const [certsRes, eventsRes] = await Promise.all([
        api.get(`/certificates?${params}`),
        api.get('/events'),
      ]);
      setCertificates(certsRes.data.certificates || []);
      setEvents(eventsRes.data.events || []);
    } catch { toast.error('Failed to load certificates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCerts(); }, [filterEvent]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCerts();
  };

  const handleDownload = async (certId, filename) => {
    try {
      const response = await api.get(`/certificates/download/${certId}`, { responseType:'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const filteredCerts = certificates.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.participantName || c.participantId?.fullName)?.toLowerCase().includes(s) ||
           (c.participantEmail || c.participantId?.email)?.toLowerCase().includes(s) ||
           c.code?.toLowerCase().includes(s) ||
           c.eventId?.title?.toLowerCase().includes(s);
  });

  return (
    <DashboardLayout title="Certificate Repository" subtitle="View, search, and download generated certificates">
      {/* Filters */}
      <div className="glass" style={{ borderRadius:16, padding:'1.25rem', marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center', flexWrap:'wrap' }}>
          <form onSubmit={handleSearch} style={{ flex:1, display:'flex', gap:'0.75rem', minWidth:280 }}>
            <div style={{ position:'relative', flex:1 }}>
              <Search size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
              <input className="input-field" style={{ paddingLeft:'2.5rem' }} placeholder="Search by name, email, or event..."
                value={search} onChange={e => setSearch(e.target.value)} id="cert-search" />
            </div>
            <button type="submit" className="btn-primary" style={{ padding:'0.625rem 1rem' }}>
              <Search size={15} /> Search
            </button>
          </form>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', minWidth:200 }}>
            <Filter size={15} color="#64748b" />
            <select className="input-field" style={{ flex:1 }} value={filterEvent} onChange={e => setFilterEvent(e.target.value)} id="cert-filter-event">
              <option value="">All Events</option>
              {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Total Certificates', value:certificates.length, icon:Award, color:'rgba(99,102,241,0.7)' },
          { label:'Emails Sent', value:certificates.filter(c=>c.emailSent).length, icon:CheckCircle, color:'rgba(16,185,129,0.7)' },
          { label:'Pending Delivery', value:certificates.filter(c=>!c.emailSent).length, icon:Clock, color:'rgba(245,158,11,0.7)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem' }}>
            <div style={{ width:40, height:40, borderRadius:10, background:s.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <s.icon size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize:'1.375rem', fontWeight:800, color:'var(--text-title)' }}>{s.value}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass" style={{ borderRadius:16, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'1.5rem' }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height:56, borderRadius:8, marginBottom:'0.5rem' }} />)}
          </div>
        ) : filteredCerts.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'#64748b' }}>
            <Award size={48} style={{ margin:'0 auto 1rem', opacity:0.3 }} />
            <p style={{ fontSize:'0.9375rem', color:'var(--text-main)', marginBottom:'0.5rem' }}>No certificates found</p>
            <p style={{ fontSize:'0.8125rem', color:'var(--text-muted)' }}>Generate certificates from the Events page.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border:'none', borderRadius:0 }}>
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Participant</th>
                  <th>Event</th>
                  <th>Generated</th>
                  <th>Email Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map(cert => (
                  <tr key={cert._id}>
                    <td>
                      <span style={{ fontFamily:'monospace', fontWeight:600, fontSize:'0.8125rem', color:'var(--text-title)' }}>
                        {cert.code || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div style={{
                          width:32, height:32, borderRadius:'50%', flexShrink:0,
                          background:'linear-gradient(135deg,#6366f1,#818cf8)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:700, fontSize:'0.75rem', color:'white'
                        }}>{(cert.participantName || cert.participantId?.fullName)?.[0]?.toUpperCase() || '?'}</div>
                        <div>
                          <div style={{ fontWeight:500, color:'var(--text-title)', fontSize:'0.875rem' }}>{cert.participantName || cert.participantId?.fullName || 'N/A'}</div>
                          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{cert.participantEmail || cert.participantId?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight:500, color:'var(--text-title)', fontSize:'0.875rem' }}>{cert.eventId?.title || 'N/A'}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{cert.eventId?.organizer}</div>
                    </td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>
                      {format(new Date(cert.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td>
                      {cert.emailSent ? (
                        <span className="badge badge-success">
                          <CheckCircle size={11} /> Sent
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                    </td>
                    <td>
                      <button className="btn-secondary" onClick={() => handleDownload(cert._id, cert.filename)}
                        style={{ padding:'0.375rem 0.75rem', fontSize:'0.75rem' }}>
                        <Download size={13} /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
