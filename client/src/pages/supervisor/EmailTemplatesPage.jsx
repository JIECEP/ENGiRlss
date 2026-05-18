import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Mail, Trash2, Edit, Upload, Eye, X, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../../components/ConfirmModal';
import { useDropzone } from 'react-dropzone';

// Preview Modal for Email Templates
function EmailPreviewModal({ template, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'#1e293b', borderRadius:16, padding:'1.5rem',
        maxWidth:600, width:'100%', maxHeight:'90vh', overflowY:'auto',
        border:'1px solid rgba(99,102,241,0.2)', animation:'slideUp 0.25s ease'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <div>
            <h3 style={{ fontWeight:700, color:'#f1f5f9' }}>{template.name}</h3>
            <div style={{ color:'#64748b', fontSize:'0.875rem' }}>Subject: {template.subject}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X size={20} /></button>
        </div>
        <div style={{ background:'#fff', color:'#000', padding:'1.5rem', borderRadius:8, marginTop:'1rem' }}
          dangerouslySetInnerHTML={{ __html: typeof template.body === 'string' ? template.body : '' }} />
      </div>
    </div>
  );
}

// Config/Form Modal
function ConfigModal({ template, onClose, onSave, saving }) {
  const [name, setName] = useState(template?.name || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [body, setBody] = useState(template?.body || '');

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 700 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ fontWeight:700, color:'#f1f5f9' }}>{template?._id ? 'Edit Template' : 'Upload Email Template'}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}><X size={20} /></button>
        </div>

        <div style={{ display:'grid', gap:'1.25rem' }}>
          <div>
            <label className="label">Template Name</label>
            <input className="input-field" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input-field" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="label">Body</label>
            <textarea className="input-field" value={body} onChange={e => setBody(e.target.value)} rows={5} />
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:'1rem', marginTop:'1.5rem' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(name, subject, body)}>
            {template?._id ? 'Update' : 'Upload and Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/email-templates');
      setTemplates(data.templates || []);
    } catch { toast.error('Failed to load email templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSave = async (name, subject, body) => {
    if (!name || !subject || !body) {
      return toast.error('All fields are required.');
    }
    setSaving(true);
    try {
      if (editingTemplate && editingTemplate._id) {
        await api.put(`/email-templates/${editingTemplate._id}`, { name, subject, body });
        toast.success('Template updated successfully!');
      } else {
        await api.post('/email-templates', { name, subject, body });
        toast.success('Template created successfully!');
      }
      setEditingTemplate(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await api.delete(`/email-templates/${templateToDelete._id}`);
      toast.success('Template deleted.');
      fetchTemplates();
    } catch { toast.error('Failed to delete template'); }
    finally { setTemplateToDelete(null); }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'html' && ext !== 'txt') {
      return toast.error('Only .html and .txt files are supported.');
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log('File read result type:', typeof e.target.result);
      setEditingTemplate({
        id: Math.random().toString(36).substring(7),
        name: file.name.replace(/\.[^/.]+$/, ""),
        subject: '',
        body: e.target.result
      });
      toast.success('File loaded.');
    };
    reader.onerror = () => {
      toast.error('Failed to read file.');
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  return (
    <DashboardLayout title="Email Templates" subtitle="Manage templates for sending certificates">
      
      {/* Upload area at the Top */}
      <div className="glass" style={{ borderRadius:16, padding:'1.5rem', marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
          <Upload size={18} color="#6366f1" />
          <span style={{ fontWeight:600, color:'#f1f5f9' }}>Upload New Template</span>
        </div>

        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} 
          style={{ 
            padding: '2rem', 
            border: '2px dashed rgba(99,102,241,0.3)', 
            borderRadius: 12, 
            textAlign: 'center', 
            cursor: 'pointer',
            background: isDragActive ? 'rgba(99,102,241,0.1)' : 'transparent',
            transition: 'background 0.2s'
          }}>
          <input {...getInputProps()} />
          <FileText size={40} color="#6366f1" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
          <div style={{ color: '#e2e8f0', fontWeight: 500, marginBottom: '0.375rem' }}>
            {isDragActive ? 'Drop the file here...' : 'Drag & drop an HTML or TXT file here'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8125rem' }}>or click to browse — will populate the form below</div>
        </div>
      </div>

      {/* Templates List at the Bottom */}
      <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
          <Mail size={18} color="#6366f1" />
          <span style={{ fontWeight:600, color:'#f1f5f9' }}>Uploaded Templates</span>
          <span className="badge badge-primary" style={{ marginLeft:'0.25rem' }}>{templates.length}</span>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height:150, borderRadius:12 }} />)}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2.5rem', color:'#64748b' }}>
            <Mail size={40} style={{ margin:'0 auto 0.75rem', opacity:0.3 }} />
            <div>No email templates created yet.</div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
            {templates.map(tmpl => (
              <div key={tmpl._id} className="card-hover" style={{
                background:'rgba(15,23,42,0.6)', border:'1px solid rgba(99,102,241,0.15)',
                borderRadius:12, padding:'1.25rem', display:'flex', flexDirection:'column', justifyContent:'space-between'
              }}>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                    <h4 style={{ fontWeight:600, color:'#e2e8f0', fontSize:'1rem' }}>{tmpl.name || 'No Name'}</h4>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <button style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }} onClick={() => setEditingTemplate(tmpl)}><Edit size={16} /></button>
                      <button style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444' }} onClick={() => setTemplateToDelete(tmpl)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div style={{ color:'#94a3b8', fontSize:'0.8125rem', marginBottom:'0.5rem' }}><strong>Subject:</strong> {tmpl.subject || 'No Subject'}</div>
                  <div style={{ color:'#64748b', fontSize:'0.8125rem', maxHeight:60, overflow:'hidden', textOverflow:'ellipsis' }}>
                    {(tmpl.body || '').replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'1rem' }}>
                  <div style={{ fontSize:'0.75rem', color:'#475569' }}>
                    {format(new Date(tmpl.createdAt), 'MMM d, yyyy')}
                  </div>
                  <button className="btn-secondary" style={{ padding:'0.375rem 0.75rem', fontSize:'0.75rem' }}
                    onClick={() => setPreviewTemplate(tmpl)}>
                    <Eye size={14} /> Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editingTemplate && (
        <ConfigModal 
          key={editingTemplate._id || editingTemplate.id || 'new'}
          template={editingTemplate} 
          onClose={() => setEditingTemplate(null)} 
          onSave={handleSave} 
          saving={saving} 
        />
      )}
      {previewTemplate && <EmailPreviewModal template={previewTemplate} onClose={() => setPreviewTemplate(null)} />}
      
      {templateToDelete && (
        <ConfirmModal
          title="Delete Template"
          message={`Are you sure you want to permanently delete template "${templateToDelete.name}"?`}
          confirmText="Yes, Delete Template"
          onConfirm={handleDelete}
          onCancel={() => setTemplateToDelete(null)}
        />
      )}
    </DashboardLayout>
  );
}
