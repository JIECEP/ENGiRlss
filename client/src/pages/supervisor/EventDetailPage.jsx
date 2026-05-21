import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CalendarDays, Image as ImageIcon, Upload, Users, FileText,
  Eye, Mail, CheckCircle, Clock, X, Download, ChevronRight, ChevronLeft, AlertCircle
} from 'lucide-react';
import PreviewModal from '../../components/PreviewModal';

const STEPS = [
  { key: 'info', label: 'Event Info', icon: CalendarDays },
  { key: 'template', label: 'Cert Template', icon: ImageIcon },
  { key: 'emailTemplate', label: 'Email Template', icon: Mail },
  { key: 'recipients', label: 'Recipients', icon: Users },
  { key: 'generate', label: 'Generate', icon: FileText },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'send', label: 'Send', icon: Mail },
];

function StepIndicator({ current, steps, onStep, event, generatedIds, participants }) {
  const canGo = (i) => {
    if (i === 0) return true;
    if (i === 1) return true;
    if (i === 2) return !!event?.templateId;
    if (i === 3) return !!event?.emailTemplateId;
    if (i === 4) return participants.length > 0 && !!event?.templateId && !!event?.emailTemplateId;
    if (i === 5) return generatedIds.length > 0;
    if (i === 6) return generatedIds.length > 0;
    return false;
  };
  return (
    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', overflowX: 'auto', padding: '0.25rem 0' }}>
      {steps.map((s, i) => {
        const Icon = s.icon;
        const active = i === current;
        const enabled = canGo(i);
        return (
          <button key={s.key} onClick={() => enabled && onStep(i)} disabled={!enabled}
            style={{
              flex: 1, minWidth: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
              padding: '0.75rem 0.5rem', borderRadius: 12, border: 'none', cursor: enabled ? 'pointer' : 'default',
              background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
              opacity: enabled ? 1 : 0.35, transition: 'all 0.2s'
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: active ? '#6366f1' : enabled ? 'rgba(99,102,241,0.1)' : 'rgba(51,65,85,0.3)',
              transition: 'all 0.2s'
            }}>
              <Icon size={16} color={active ? 'white' : enabled ? '#818cf8' : '#475569'} />
            </div>
            <span style={{ fontSize: '0.6875rem', fontWeight: active ? 700 : 500, color: active ? '#e2e8f0' : '#64748b' }}>
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Step 1: Event Info
function StepInfo({ event, onUpdate }) {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(event?.date ? new Date(event.date).toISOString().split('T')[0] : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(event?.title || '');
    setDescription(event?.description || '');
    setDate(event?.date ? new Date(event.date).toISOString().split('T')[0] : '');
  }, [event]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({ title, description, date });
      toast.success('Event updated!');
    } finally { setSaving(false); }
  };

  return (
    <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '1.25rem' }}>Event Details</h3>
      <div style={{ display: 'grid', gap: '1.25rem', maxWidth: 500 }}>
        <div>
          <label className="label">Title</label>
          <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ resize: 'vertical' }} />
        </div>
        <div>
          <label className="label">Date</label>
          <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ justifySelf: 'start' }}>
          {saving ? <><div className="spinner" /> Saving...</> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// Step 2: Template Selection
function StepTemplate({ event, onUpdate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/templates').then(r => setTemplates(r.data.templates || []))
      .catch(() => toast.error('Failed to load templates'))
      .finally(() => setLoading(false));
  }, []);

  const selectTemplate = async (tmplId) => {
    setSaving(true);
    try {
      await onUpdate({ templateId: tmplId });
      toast.success('Template selected!');
    } finally { setSaving(false); }
  };

  return (
    <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Select Certificate Template</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>Choose a template for this event's certificates.</p>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />)}
        </div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <ImageIcon size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p>No templates uploaded. Go to Templates page first.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
          {templates.map(tmpl => {
            const selected = event?.templateId?._id === tmpl._id || event?.templateId === tmpl._id;
            return (
              <div key={tmpl._id} className="card-hover" onClick={() => !saving && selectTemplate(tmpl._id)}
                style={{
                  background: selected ? 'rgba(99,102,241,0.12)' : 'rgba(15,23,42,0.6)',
                  border: selected ? '2px solid #6366f1' : '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 12, overflow: 'hidden', cursor: saving ? 'wait' : 'pointer',
                }}>
                <div style={{ height: 140, overflow: 'hidden', background: '#0f172a' }}>
                  <img src={`/uploads/templates/${tmpl.filename}`} alt={tmpl.originalName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {tmpl.originalName}
                  </span>
                  {selected && <CheckCircle size={16} color="#6366f1" style={{ flexShrink: 0 }} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Step 2.5: Email Template Selection
function StepEmailTemplate({ event, onUpdate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/email-templates').then(r => setTemplates(r.data.templates || []))
      .catch(() => toast.error('Failed to load email templates'))
      .finally(() => setLoading(false));
  }, []);

  const selectTemplate = async (tmplId) => {
    setSaving(true);
    try {
      await onUpdate({ emailTemplateId: tmplId });
      toast.success('Email template selected!');
    } finally { setSaving(false); }
  };

  return (
    <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Select Email Template</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>Choose a template for the emails sent to participants.</p>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <Mail size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p>No email templates created yet. Go to Email Templates page first.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
          {templates.map(tmpl => {
            const selected = event?.emailTemplateId?._id === tmpl._id || event?.emailTemplateId === tmpl._id;
            return (
              <div key={tmpl._id} className="card-hover" onClick={() => !saving && selectTemplate(tmpl._id)}
                style={{
                  background: selected ? 'rgba(99,102,241,0.12)' : 'rgba(15,23,42,0.6)',
                  border: selected ? '2px solid #6366f1' : '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 12, padding: '1rem', cursor: saving ? 'wait' : 'pointer',
                  display:'flex', justifyContent:'space-between', alignItems:'center'
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tmpl.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Subject: {tmpl.subject}
                  </div>
                </div>
                {selected && <CheckCircle size={16} color="#6366f1" style={{ flexShrink: 0, marginLeft: '0.5rem' }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Step 3: Upload Recipients
function StepRecipients({ participants, setParticipants, setGeneratedIds, setSentCount }) {
  const onDrop = useCallback((files) => {
    if (!files.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        const parsed = json.map((row, i) => {
          const keys = Object.keys(row);
          const nk = keys.find(k => k.toLowerCase().includes('name')) || keys[0];
          const ek = keys.find(k => k.toLowerCase().includes('email')) || keys[1];
          return { id: i, name: row[nk] || '', email: row[ek] || '' };
        }).filter(p => p.name && p.email);
        if (!parsed.length) return toast.error("No valid 'Name' and 'Email' columns found.");
        setParticipants(parsed);
        setGeneratedIds([]);
        setSentCount(0);
        toast.success(`Loaded ${parsed.length} participants.`);
      } catch { toast.error('Failed to parse file.'); }
    };
    reader.readAsArrayBuffer(files[0]);
  }, [setParticipants, setGeneratedIds, setSentCount]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, maxFiles: 1,
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }
  });

  return (
    <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Upload Recipients</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>Upload a CSV or Excel file with "Name" and "Email" columns.</p>
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
        <input {...getInputProps()} />
        <Upload size={32} color="#6366f1" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
        <p style={{ color: '#e2e8f0', fontWeight: 500 }}>{isDragActive ? 'Drop file here...' : 'Drag & drop CSV/Excel file'}</p>
        <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem' }}>or click to browse</p>
      </div>
      {participants.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0' }}>
              <Users size={14} style={{ marginRight: '0.375rem', verticalAlign: 'text-bottom' }} />
              {participants.length} recipients loaded
            </span>
            <button className="btn-secondary" style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
              onClick={() => { setParticipants([]); setGeneratedIds([]); setSentCount(0); }}>Clear</button>
          </div>
          <div className="table-container" style={{ maxHeight: 280 }}>
            <table><thead><tr><th>#</th><th>Name</th><th>Email</th></tr></thead>
              <tbody>{participants.slice(0, 100).map((p, i) => (
                <tr key={i}><td>{i + 1}</td><td>{p.name}</td><td>{p.email}</td></tr>
              ))}</tbody>
            </table>
          </div>
          {participants.length > 100 && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>Showing first 100 of {participants.length}...</p>}
        </div>
      )}
    </div>
  );
}

// Step 4: Generate
function StepGenerate({ event, participants, generatedIds, setGeneratedIds, generating, setGenerating }) {
  const handleGenerate = async () => {
    if (!participants.length) return toast.error('No participants loaded.');
    if (!event?.templateId?._id && !event?.templateId) return toast.error('No template selected.');
    setGenerating(true);
    try {
      const templateId = event.templateId._id || event.templateId;
      const res = await api.post('/certificates/generate', {
        templateId, eventId: event._id,
        participants: participants.map(p => ({ name: p.name, email: p.email }))
      });
      setGeneratedIds(res.data.generated.map(g => g.id));
      toast.success(res.data.message);
      if (res.data.errors?.length) toast.error(`${res.data.errors.length} failed.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally { setGenerating(false); }
  };

  return (
    <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Generate Certificates</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
        Generate PDF certificates for all {participants.length} recipients using the selected template.
      </p>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={16} color="#818cf8" />
          <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}><strong>{participants.length}</strong> recipients</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ImageIcon size={16} color="#0ea5e9" />
          <span style={{ fontSize: '0.875rem', color: '#e2e8f0' }}>{event?.templateId?.originalName || 'Template selected'}</span>
        </div>
      </div>
      {generatedIds.length > 0 ? (
        <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={22} color="#10b981" />
          <div>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Successfully generated {generatedIds.length} certificates!</span>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.25rem' }}>Proceed to Preview or Send.</p>
          </div>
        </div>
      ) : (
        <button className="btn-primary" onClick={handleGenerate} disabled={generating || !participants.length}
          style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
          {generating ? <><div className="spinner" /> Generating...</> : <><FileText size={18} /> Generate {participants.length} Certificates</>}
        </button>
      )}
    </div>
  );
}

// Step 5: Preview
function StepPreview({ event, generatedIds }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    if (!event?._id) return;
    api.get(`/certificates?eventId=${event._id}`)
      .then(r => setCerts(r.data.certificates || []))
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, [event?._id, generatedIds]);

  const handleDownload = async (certId, filename) => {
    try {
      const r = await api.get(`/certificates/download/${certId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const handlePreview = async (certId) => {
    try {
      const r = await api.get(`/certificates/download/${certId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    } catch { toast.error('Preview failed'); }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Preview Certificates</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>Review generated certificates before sending.</p>
      {loading ? (
        <div>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, marginBottom: '0.5rem' }} />)}</div>
      ) : certs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
          <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p>No certificates generated yet.</p>
        </div>
      ) : (
        <div className="table-container" style={{ maxHeight: 400 }}>
          <table>
            <thead><tr><th>Recipient</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{certs.map(c => (
              <tr key={c._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: 'white', flexShrink: 0 }}>
                      {c.participantName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.875rem' }}>{c.participantName}</span>
                  </div>
                </td>
                <td style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>{c.participantEmail}</td>
                <td>{c.emailSent
                  ? <span className="badge badge-success"><CheckCircle size={11} /> Sent</span>
                  : <span className="badge badge-warning"><Clock size={11} /> Pending</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-secondary" style={{ padding: '0.3rem 0.625rem', fontSize: '0.75rem' }}
                      onClick={() => handlePreview(c._id)}>
                      <Eye size={12} /> Preview
                    </button>
                    <button className="btn-secondary" style={{ padding: '0.3rem 0.625rem', fontSize: '0.75rem' }}
                      onClick={() => handleDownload(c._id, c.filename)}>
                      <Download size={12} /> PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal isOpen={isPreviewOpen} onClose={closePreview} url={previewUrl} />
    </div>
  );
}

// Step 6: Send
function StepSend({ event, generatedIds, sentCount, setSentCount }) {
  const [sending, setSending] = useState(false);
  const [certs, setCerts] = useState([]);

  useEffect(() => {
    if (!event?._id) return;
    api.get(`/certificates?eventId=${event._id}`)
      .then(r => setCerts(r.data.certificates || []))
      .catch(() => { });
  }, [event?._id, generatedIds, sentCount]);

  const unsent = certs.filter(c => !c.emailSent);
  const sent = certs.filter(c => c.emailSent);

  const handleSend = async () => {
    const ids = unsent.map(c => c._id);
    if (!ids.length) return toast.error('No pending certificates to send.');
    setSending(true);
    try {
      const res = await api.post('/certificates/send-email', { 
        certificateIds: ids,
        emailTemplateId: event.emailTemplateId?._id || event.emailTemplateId
      });
      setSentCount(res.data.sent.length);
      if (res.data.failed?.length) toast.error(`${res.data.failed.length} emails failed.`);
      else toast.success('All emails sent successfully!');
      // Refresh
      const r = await api.get(`/certificates?eventId=${event._id}`);
      setCerts(r.data.certificates || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email sending failed');
    } finally { setSending(false); }
  };

  return (
    <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
      <h3 style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>Send Certificates</h3>
      <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>Email certificates to all recipients.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: certs.length, icon: FileText, color: 'rgba(99,102,241,0.7)' },
          { label: 'Sent', value: sent.length, icon: CheckCircle, color: 'rgba(16,185,129,0.7)' },
          { label: 'Pending', value: unsent.length, icon: Clock, color: 'rgba(245,158,11,0.7)' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9' }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {unsent.length > 0 ? (
        <button className="btn-success" onClick={handleSend} disabled={sending}
          style={{ padding: '1rem 2rem', fontSize: '1rem', width: '100%', justifyContent: 'center' }}>
          {sending ? <><div className="spinner" /> Sending emails...</> : <><Mail size={18} /> Send {unsent.length} Email{unsent.length !== 1 ? 's' : ''}</>}
        </button>
      ) : certs.length > 0 ? (
        <div style={{ padding: '1.25rem', background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <CheckCircle size={22} color="#10b981" />
          <div>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>All certificates have been sent!</span>
            <p style={{ color: '#94a3b8', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{sent.length} email{sent.length !== 1 ? 's' : ''} delivered successfully.</p>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
          <p>No certificates to send. Generate them first.</p>
        </div>
      )}
    </div>
  );
}

// Main Page
export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [generatedIds, setGeneratedIds] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const fetchEvent = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data.event);
      if (data.event.totalCerts > 0) {
        const certsRes = await api.get(`/certificates?eventId=${id}`);
        const certs = certsRes.data.certificates || [];
        setGeneratedIds(certs.map(c => c._id));
        setSentCount(certs.filter(c => c.emailSent).length);
      }
    } catch { toast.error('Failed to load event'); navigate('/supervisor/events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvent(); }, [id]);

  const handleUpdate = async (updates) => {
    const { data } = await api.put(`/events/${id}`, updates);
    setEvent(data.event);
  };

  if (loading) return (
    <DashboardLayout title="Loading..." subtitle="">
      <div className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: '1rem' }} />
      <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
    </DashboardLayout>
  );

  if (!event) return null;

  const renderStep = () => {
    switch (step) {
      case 0: return <StepInfo event={event} onUpdate={handleUpdate} />;
      case 1: return <StepTemplate event={event} onUpdate={handleUpdate} />;
      case 2: return <StepEmailTemplate event={event} onUpdate={handleUpdate} />;
      case 3: return <StepRecipients participants={participants} setParticipants={setParticipants} setGeneratedIds={setGeneratedIds} setSentCount={setSentCount} />;
      case 4: return <StepGenerate event={event} participants={participants} generatedIds={generatedIds} setGeneratedIds={setGeneratedIds} generating={generating} setGenerating={setGenerating} />;
      case 5: return <StepPreview event={event} generatedIds={generatedIds} />;
      case 6: return <StepSend event={event} generatedIds={generatedIds} sentCount={sentCount} setSentCount={setSentCount} />;
      default: return null;
    }
  };

  return (
    <DashboardLayout title={event.title} subtitle={`Event — ${new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}>
      <button className="btn-secondary" onClick={() => navigate('/supervisor/events')}
        style={{ marginBottom: '1.25rem', padding: '0.5rem 1rem', fontSize: '0.8125rem' }}>
        <ArrowLeft size={15} /> Back to Events
      </button>

      <StepIndicator current={step} steps={STEPS} onStep={setStep}
        event={event} generatedIds={generatedIds} participants={participants} />

      {renderStep()}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
        <button className="btn-secondary" onClick={() => setStep(s => s - 1)} disabled={step === 0}
          style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
          <ChevronLeft size={16} /> Previous
        </button>
        <button className="btn-primary" onClick={() => setStep(s => s + 1)} disabled={step === STEPS.length - 1}
          style={{ visibility: step === STEPS.length - 1 ? 'hidden' : 'visible' }}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </DashboardLayout>
  );
}
