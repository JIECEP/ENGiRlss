import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, CheckCircle, Mail, Eye, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function CertificatesGeneratorPage() {
  const [templates, setTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [generatedIds, setGeneratedIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tmplRes, emailRes] = await Promise.all([
          api.get('/templates'),
          api.get('/email-templates')
        ]);
        setTemplates(tmplRes.data.templates || []);
        setEmailTemplates(emailRes.data.templates || []);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const parsed = json.map((row, i) => {
          const keys = Object.keys(row);
          const nameKey = keys.find(k => k.toLowerCase().includes('name')) || keys[0];
          const emailKey = keys.find(k => k.toLowerCase().includes('email')) || keys[1];
          return { id: i, name: row[nameKey] || '', email: row[emailKey] || '' };
        }).filter(p => p.name && p.email);

        if (parsed.length === 0) {
          toast.error("Could not find valid 'Name' and 'Email' columns in the file.");
          return;
        }

        setParticipants(parsed);
        setGeneratedIds([]);
        setSentCount(0);
        toast.success(`Loaded ${parsed.length} participants.`);
      } catch (err) {
        toast.error('Failed to parse file.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const handleGenerate = async () => {
    if (!participants.length) return toast.error('No participants loaded.');
    setGenerating(true);
    try {
      const res = await api.post('/certificates/generate', {
        templateId: selectedTemplate._id,
        participants: participants.map(p => ({ name: p.name, email: p.email }))
      });
      setGeneratedIds(res.data.generated.map(g => g.id));
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmails = async () => {
    if (!generatedIds.length) return toast.error('No certificates generated yet.');
    setSending(true);
    try {
      const res = await api.post('/certificates/send-email', { 
        certificateIds: generatedIds,
        emailTemplateId: selectedEmailTemplate?._id
      });
      setSentCount(res.data.sent.length);
      if (res.data.failed.length > 0) {
        toast.error(`${res.data.failed.length} emails failed to send.`);
      } else {
        toast.success('All emails sent successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Email sending failed');
    } finally {
      setSending(false);
    }
  };

  const resetSelection = () => {
    setSelectedTemplate(null);
    setSelectedEmailTemplate(null);
    setParticipants([]);
    setGeneratedIds([]);
    setSentCount(0);
  };

  if (selectedTemplate) {
    return (
      <DashboardLayout title={`Generate Certificates`} subtitle={`Using template: ${selectedTemplate.originalName}`}>
        <div style={{ display:'flex', gap:'1rem', marginBottom:'1.5rem' }}>
          <button className="btn-secondary" onClick={resetSelection}>← Back to Templates</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'1.5rem', alignItems:'start' }}>
          
          {/* Main workspace */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
            
            {/* Step 1: Upload CSV */}
            <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
              <h3 style={{ fontSize:'1.125rem', fontWeight:700, color:'var(--text-title)', marginBottom:'1rem' }}>
                1. Upload Participants List
              </h3>
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <Upload size={32} color="#6366f1" style={{ margin:'0 auto 1rem', opacity:0.8 }} />
                <p style={{ color:'var(--text-main)', fontWeight:500 }}>Drop your CSV or Excel file here</p>
                <p style={{ color:'var(--text-muted)', fontSize:'0.8125rem', marginTop:'0.25rem' }}>
                  Must contain "Name" and "Email" columns
                </p>
              </div>

              {participants.length > 0 && (
                <div style={{ marginTop:'1.5rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                    <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-title)' }}>Preview ({participants.length} rows)</span>
                  </div>
                  <div className="table-container" style={{ maxHeight: 250 }}>
                    <table>
                      <thead><tr><th>Name</th><th>Email</th></tr></thead>
                      <tbody>
                        {participants.slice(0, 50).map((p, i) => (
                          <tr key={i}><td>{p.name}</td><td>{p.email}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Step 1.5: Select Email Template */}
            <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
              <h3 style={{ fontSize:'1.125rem', fontWeight:700, color:'var(--text-title)', marginBottom:'1rem' }}>
                2. Select Email Template
              </h3>
              {emailTemplates.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.875rem' }}>No email templates found.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '1rem' }}>
                  {emailTemplates.map(tmpl => {
                    const selected = selectedEmailTemplate?._id === tmpl._id;
                    return (
                      <div key={tmpl._id} className="card-hover" onClick={() => setSelectedEmailTemplate(tmpl)}
                        style={{
                          background: selected ? 'rgba(99,102,241,0.12)' : 'var(--bg-surface)',
                          border: selected ? '2px solid #6366f1' : '1px solid var(--border-color)',
                          borderRadius: 12, padding: '1rem', cursor: 'pointer',
                          display:'flex', justifyContent:'space-between', alignItems:'center'
                        }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-title)', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tmpl.name}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

            {/* Step 3: Actions */}
            <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
              <h3 style={{ fontSize:'1.125rem', fontWeight:700, color:'var(--text-title)', marginBottom:'1rem' }}>
                3. Process & Dispatch
              </h3>
              
              <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
                <button className="btn-primary" onClick={handleGenerate} disabled={!participants.length || generating || generatedIds.length > 0} style={{ flex:1, padding:'1rem', justifyContent:'center' }}>
                  {generating ? <div className="spinner" /> : <><FileText size={18} /> Generate {participants.length} Certificates</>}
                </button>
                
                <button className="btn-success" onClick={handleSendEmails} disabled={!generatedIds.length || sending || sentCount > 0} style={{ flex:1, padding:'1rem', justifyContent:'center' }}>
                  {sending ? <div className="spinner" /> : <><Mail size={18} /> Send {generatedIds.length} Emails</>}
                </button>
              </div>
              
              {generatedIds.length > 0 && (
                <div style={{ marginTop:'1rem', padding:'1rem', background:'rgba(16,185,129,0.1)', borderRadius:10, border:'1px solid rgba(16,185,129,0.2)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <CheckCircle size={20} color="#10b981" />
                  <span style={{ color:'var(--text-main)', fontSize:'0.875rem' }}>Successfully generated {generatedIds.length} PDFs.</span>
                </div>
              )}
              
              {sentCount > 0 && (
                <div style={{ marginTop:'0.75rem', padding:'1rem', background:'rgba(59,130,246,0.1)', borderRadius:10, border:'1px solid rgba(59,130,246,0.2)', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <CheckCircle size={20} color="#3b82f6" />
                  <span style={{ color:'var(--text-main)', fontSize:'0.875rem' }}>Successfully dispatched {sentCount} emails.</span>
                </div>
              )}
            </div>
            
          </div>

          {/* Right sidebar: Template Info */}
          <div className="glass" style={{ borderRadius:16, padding:'1.5rem', position:'sticky', top:'1.5rem' }}>
            <h4 style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'1rem' }}>Selected Template</h4>
            <div style={{ background:'#0f172a', borderRadius:10, overflow:'hidden', marginBottom:'1rem' }}>
              <img src={`/uploads/templates/${selectedTemplate.filename}`} alt="Template" style={{ width:'100%', display:'block' }} />
            </div>
            <div style={{ fontSize:'0.875rem', color:'var(--text-title)', fontWeight:600, wordBreak:'break-all' }}>{selectedTemplate.originalName}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                {selectedTemplate.fontFamily}
              </span>
              <span className="badge badge-secondary" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                {selectedTemplate.fontSize}pt
              </span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Certificate Generator" subtitle="Select a template to batch generate certificates">
      <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
          <ImageIcon size={18} color="#6366f1" />
          <span style={{ fontWeight:600, color:'var(--text-title)' }}>Available Templates</span>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1rem' }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height:200, borderRadius:12 }} />)}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'#64748b' }}>
            <ImageIcon size={48} style={{ margin:'0 auto 1rem', opacity:0.3 }} />
            <p style={{ color:'var(--text-main)', fontWeight:500 }}>No templates found</p>
            <p style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>Please upload a template in the Templates tab first.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1.25rem' }}>
            {templates.map(tmpl => (
              <div key={tmpl._id} className="card-hover" style={{
                background:'var(--bg-surface)', border:'1px solid var(--border-color)',
                borderRadius:12, overflow:'hidden', cursor:'pointer'
              }} onClick={() => setSelectedTemplate(tmpl)}>
                <div style={{ height:160, overflow:'hidden', background:'#0f172a', position:'relative' }}>
                  <img
                    src={`/uploads/templates/${tmpl.filename}`}
                    alt={tmpl.originalName}
                    style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.3s' }}
                    className="hover-scale"
                  />
                  <div style={{ position:'absolute', top:'0.5rem', right:'0.5rem' }}>
                    <span className="badge badge-primary" style={{ fontSize:'0.675rem', padding:'0.2rem 0.4rem', fontWeight:600 }}>
                      {tmpl.fontFamily} - {tmpl.fontSize}pt
                    </span>
                  </div>
                </div>
                <div style={{ padding:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontWeight:600, color:'var(--text-title)', fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {tmpl.originalName}
                  </div>
                  <button className="btn-primary" style={{ padding:'0.375rem 0.75rem', fontSize:'0.75rem', flexShrink:0 }}>
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
