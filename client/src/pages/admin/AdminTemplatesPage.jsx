import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Image, Trash2, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/templates');
      setTemplates(data.templates || []);
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await api.delete(`/templates/${templateToDelete._id}`);
      toast.success('Template deleted.');
      fetchTemplates();
    } catch { toast.error('Failed to delete template'); }
    finally { setTemplateToDelete(null); }
  };

  return (
    <DashboardLayout title="System Templates" subtitle="View and manage all certificate templates uploaded by supervisors">
      <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
          <Image size={18} color="#6366f1" />
          <span style={{ fontWeight:600, color:'var(--text-title)' }}>All Uploaded Templates</span>
          <span className="badge badge-primary" style={{ marginLeft:'0.25rem' }}>{templates.length}</span>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1.5rem' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height:220, borderRadius:12 }} />)}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'#64748b' }}>
            <Image size={48} style={{ margin:'0 auto 1rem', opacity:0.3 }} />
            <p style={{ color:'var(--text-main)', fontWeight:500 }}>No templates found</p>
            <p style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>Supervisors have not uploaded any templates yet.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1.5rem' }}>
            {templates.map(tmpl => (
              <div key={tmpl._id} className="card-hover" style={{
                background:'var(--bg-surface)', border:'1px solid var(--border-color)',
                borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column'
              }}>
                <div style={{ height:180, overflow:'hidden', background:'#0f172a', position:'relative' }}>
                  <img
                    src={`/uploads/templates/${tmpl.filename}`}
                    alt={tmpl.originalName}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
                  <div style={{ position:'absolute', top:'0.5rem', right:'0.5rem' }}>
                    <span className="badge badge-primary" style={{ fontWeight: 600 }}>
                      {tmpl.fontFamily} - {tmpl.fontSize}pt
                    </span>
                  </div>
                </div>
                
                <div style={{ padding:'1rem', flex:1, display:'flex', flexDirection:'column' }}>
                  <div style={{ fontWeight:600, color:'var(--text-title)', fontSize:'0.9375rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'0.5rem' }}>
                    {tmpl.originalName}
                  </div>
                  
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg, #6366f1, #818cf8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <User size={12} color="white" />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {tmpl.uploadedBy?.name || 'Unknown User'}
                      </div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>
                        {format(new Date(tmpl.createdAt), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop:'auto', display:'flex', justifyContent:'flex-end' }}>
                    <button className="btn-danger" style={{ padding:'0.375rem 0.75rem', fontSize:'0.75rem' }}
                      onClick={() => setTemplateToDelete(tmpl)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {templateToDelete && (
        <ConfirmModal
          title="Delete Template"
          message={`Are you sure you want to permanently delete template "${templateToDelete.originalName}"? This action cannot be undone.`}
          confirmText="Yes, Delete Template"
          onConfirm={handleDelete}
          onCancel={() => setTemplateToDelete(null)}
        />
      )}
    </DashboardLayout>
  );
}
