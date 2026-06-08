import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useDropzone } from 'react-dropzone';
import { Image, Upload, Trash2, Eye, X, FileImage } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../../components/ConfirmModal';

function getCssFont(fontStr) {
  if (fontStr?.includes('Times')) return '"Times New Roman", Times, serif';
  if (fontStr?.includes('Courier')) return '"Courier New", Courier, monospace';
  return 'Arial, Helvetica, sans-serif';
}

function TemplatePreviewModal({ template, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'var(--bg-surface)', borderRadius:16, padding:'1.5rem',
        maxWidth:800, width:'100%', maxHeight:'90vh', overflowY:'auto',
        border:'1px solid var(--border-color)', animation:'slideUp 0.25s ease'
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ fontWeight:700, color:'var(--text-title)' }}>{template.originalName}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div style={{ position:'relative', display:'block', width:'100%', background:'#0f172a', borderRadius:10, overflow:'hidden' }}>
          <img
            src={`/uploads/templates/${template.filename}`}
            alt={template.originalName}
            style={{ width:'100%', display:'block', pointerEvents:'none' }}
          />
          <div style={{
            position:'absolute',
            left: `${(template.nameX || 0.5) * 100}%`,
            top: `${(template.nameY || 0.5) * 100}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            color: '#111',
            fontWeight: template.fontFamily?.includes('Bold') ? 'bold' : 'normal',
            fontFamily: getCssFont(template.fontFamily),
            fontSize: `${template.fontSize || 42}px`,
            whiteSpace: 'nowrap',
            textShadow: '0 0 6px rgba(255,255,255,0.9)'
          }}>
            [Participant Name]
          </div>
          <div style={{
            position:'absolute',
            left: `${(template.codeX || 0.5) * 100}%`,
            top: `${(template.codeY || 0.8) * 100}%`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            color: '#333',
            fontWeight: template.codeFontFamily?.includes('Bold') ? 'bold' : 'normal',
            fontFamily: getCssFont(template.codeFontFamily || 'Helvetica'),
            fontSize: `${template.codeFontSize || 16}px`,
            whiteSpace: 'nowrap',
            textShadow: '0 0 6px rgba(255,255,255,0.9)'
          }}>
            [Certificate Code]
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ file, onClose, onUpload, uploading }) {
  const [activeItem, setActiveItem] = useState('name'); // 'name' | 'code'
  
  const [nameX, setNameX] = useState(0.5);
  const [nameY, setNameY] = useState(0.5);
  const [nameFontSize, setNameFontSize] = useState(42);
  const [nameFontFamily, setNameFontFamily] = useState('Helvetica-Bold');
  
  const [codeX, setCodeX] = useState(0.5);
  const [codeY, setCodeY] = useState(0.8);
  const [codeFontSize, setCodeFontSize] = useState(16);
  const [codeFontFamily, setCodeFontFamily] = useState('Helvetica');
  
  const [previewUrl, setPreviewUrl] = useState('');
  const [draggingElement, setDraggingElement] = useState(null); // 'name' | 'code' | null
  const containerRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const updatePosition = (clientX, clientY, rect, elementToUpdate) => {
    let x = (clientX - rect.left) / rect.width;
    let y = (clientY - rect.top) / rect.height;
    // clamp
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    const target = elementToUpdate || activeItem;
    if (target === 'name') {
      setNameX(x);
      setNameY(y);
    } else {
      setCodeX(x);
      setCodeY(y);
    }
  };

  const handlePointerDown = (e) => {
    const isName = e.target.closest('[data-drag="name"]');
    const isCode = e.target.closest('[data-drag="code"]');
    let targetElement = activeItem;
    if (isName) {
      targetElement = 'name';
      setActiveItem('name');
    } else if (isCode) {
      targetElement = 'code';
      setActiveItem('code');
    }
    setDraggingElement(targetElement);
    const rect = containerRef.current.getBoundingClientRect();
    updatePosition(e.clientX, e.clientY, rect, targetElement);
    containerRef.current.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingElement) return;
    const rect = containerRef.current.getBoundingClientRect();
    updatePosition(e.clientX, e.clientY, rect, draggingElement);
  };

  const handlePointerUp = (e) => {
    if (draggingElement) {
      containerRef.current.releasePointerCapture(e.pointerId);
      setDraggingElement(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 900 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ fontWeight:700, color:'var(--text-title)' }}>Configure Template</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }} disabled={uploading}><X size={20} /></button>
        </div>

        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
          <button 
            type="button" 
            className={`btn-primary`} 
            style={{ flex:1, padding:'0.625rem', fontWeight:600, background: activeItem === 'name' ? 'var(--primary-color)' : 'rgba(99,102,241,0.15)', color: activeItem === 'name' ? 'white' : 'var(--text-main)', border:'1px solid var(--border-color)', borderRadius:8 }}
            onClick={() => setActiveItem('name')}
          >
            Position Participant Name
          </button>
          <button 
            type="button" 
            className={`btn-primary`} 
            style={{ flex:1, padding:'0.625rem', fontWeight:600, background: activeItem === 'code' ? 'var(--success-color, #10b981)' : 'rgba(16,185,129,0.15)', color: activeItem === 'code' ? 'white' : 'var(--text-main)', border:'1px solid var(--border-color)', borderRadius:8 }}
            onClick={() => setActiveItem('code')}
          >
            Position Certificate Code
          </button>
        </div>

        <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:200 }}>
            <label className="label" style={{ fontSize:'0.75rem', marginBottom:'0.25rem' }}>
              {activeItem === 'name' ? 'Name Font Style' : 'Code Font Style'}
            </label>
            <select 
              className="input-field" 
              value={activeItem === 'name' ? nameFontFamily : codeFontFamily} 
              onChange={e => activeItem === 'name' ? setNameFontFamily(e.target.value) : setCodeFontFamily(e.target.value)} 
              style={{ padding:'0.5rem' }}
            >
              <option value="Helvetica-Bold">Helvetica Bold</option>
              <option value="Helvetica">Helvetica Normal</option>
              <option value="Times-Bold">Times Bold</option>
              <option value="Times-Roman">Times Normal</option>
              <option value="Courier-Bold">Courier Bold</option>
              <option value="Courier">Courier Normal</option>
            </select>
          </div>
          <div style={{ flex:1, minWidth:200 }}>
            <label className="label" style={{ fontSize:'0.75rem', marginBottom:'0.25rem' }}>
              {activeItem === 'name' ? `Name Font Size (${nameFontSize}pt)` : `Code Font Size (${codeFontSize}pt)`}
            </label>
            <input 
              type="range" 
              min={activeItem === 'name' ? "16" : "8"} 
              max={activeItem === 'name' ? "120" : "48"} 
              value={activeItem === 'name' ? nameFontSize : codeFontSize} 
              onChange={e => activeItem === 'name' ? setNameFontSize(Number(e.target.value)) : setCodeFontSize(Number(e.target.value))} 
              style={{ width:'100%', accentColor: activeItem === 'name' ? '#6366f1' : '#10b981' }} 
            />
          </div>
        </div>

        <p style={{ color:'var(--text-muted)', fontSize:'0.8125rem', marginBottom:'0.75rem' }}>
          Click or drag anywhere on the template to place the <strong>{activeItem === 'name' ? 'Participant Name' : 'Certificate Code'}</strong>, or click the labels directly to switch elements.
        </p>

        <div 
          ref={containerRef}
          style={{ position:'relative', display:'block', width:'100%', background:'#0f172a', borderRadius:10, overflow:'hidden', cursor: draggingElement ? 'grabbing' : 'grab', touchAction:'none', userSelect:'none', WebkitUserSelect:'none', MozUserSelect:'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img src={previewUrl} alt="Template Preview" style={{ width:'100%', display:'block', pointerEvents:'none' }} draggable="false" />
          
          <div 
            data-drag="name"
            style={{
              position:'absolute',
              left: `${nameX * 100}%`,
              top: `${nameY * 100}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              cursor: draggingElement === 'name' ? 'grabbing' : 'grab',
              color: '#111',
              fontWeight: nameFontFamily.includes('Bold') ? 'bold' : 'normal',
              fontFamily: getCssFont(nameFontFamily),
              fontSize: `${nameFontSize}px`,
              whiteSpace: 'nowrap',
              textShadow: '0 0 6px rgba(255,255,255,0.9)',
              border: activeItem === 'name' ? '2px dashed #6366f1' : '1px solid transparent',
              padding: '4px',
              borderRadius: '4px',
              zIndex: activeItem === 'name' ? 10 : 2
            }}
          >
            [Participant Name]
          </div>

          <div 
            data-drag="code"
            style={{
              position:'absolute',
              left: `${codeX * 100}%`,
              top: `${codeY * 100}%`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'auto',
              cursor: draggingElement === 'code' ? 'grabbing' : 'grab',
              color: '#333',
              fontWeight: codeFontFamily.includes('Bold') ? 'bold' : 'normal',
              fontFamily: getCssFont(codeFontFamily),
              fontSize: `${codeFontSize}px`,
              whiteSpace: 'nowrap',
              textShadow: '0 0 6px rgba(255,255,255,0.9)',
              border: activeItem === 'code' ? '2px dashed #10b981' : '1px solid transparent',
              padding: '4px',
              borderRadius: '4px',
              zIndex: activeItem === 'code' ? 10 : 2
            }}
          >
            [Certificate Code]
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'1rem', marginTop:'1.5rem' }}>
          <button className="btn-secondary" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="btn-primary" onClick={() => onUpload(nameX, nameY, nameFontSize, nameFontFamily, codeX, codeY, codeFontSize, codeFontFamily)} disabled={uploading}>
            {uploading ? <><div className="spinner" /> Uploading...</> : <><Upload size={16} /> Upload & Save</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/templates');
      setTemplates(data.templates || []);
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setPendingFile(acceptedFiles[0]);
  }, []);

  const handleUpload = async (nameX, nameY, fontSize, fontFamily, codeX, codeY, codeFontSize, codeFontFamily) => {
    const formData = new FormData();
    formData.append('template', pendingFile);
    formData.append('nameX', nameX);
    formData.append('nameY', nameY);
    formData.append('fontSize', fontSize);
    formData.append('fontFamily', fontFamily);
    formData.append('codeX', codeX);
    formData.append('codeY', codeY);
    formData.append('codeFontSize', codeFontSize);
    formData.append('codeFontFamily', codeFontFamily);
    setUploading(true);
    try {
      await api.post('/templates/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Template uploaded & configured successfully!');
      setPendingFile(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

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
    <DashboardLayout title="Certificate Templates" subtitle="Upload and manage certificate background templates">
      {/* Upload area */}
      <div className="glass" style={{ borderRadius:16, padding:'1.5rem', marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
          <Upload size={18} color="#6366f1" />
          <span style={{ fontWeight:600, color:'var(--text-title)' }}>Upload New Template</span>
        </div>
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} id="template-dropzone">
          <input {...getInputProps()} />
          {uploading ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem' }}>
              <div className="spinner" style={{ width:32, height:32, borderWidth:3 }} />
              <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Uploading template...</span>
            </div>
          ) : (
            <>
              <FileImage size={40} color="#6366f1" style={{ margin:'0 auto 1rem', opacity:0.7 }} />
              <p style={{ color:'var(--text-main)', fontWeight:500, marginBottom:'0.375rem' }}>
                {isDragActive ? 'Drop the template here...' : 'Drag & drop a certificate template'}
              </p>
              <p style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>or click to browse — PNG, JPG up to 10MB</p>
            </>
          )}
        </div>
      </div>

      {/* Template grid */}
      <div className="glass" style={{ borderRadius:16, padding:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1.25rem' }}>
          <Image size={18} color="#6366f1" />
          <span style={{ fontWeight:600, color:'var(--text-title)' }}>Uploaded Templates</span>
          <span className="badge badge-primary" style={{ marginLeft:'0.25rem' }}>{templates.length}</span>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1rem' }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height:200, borderRadius:12 }} />)}
          </div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign:'center', padding:'2.5rem', color:'#64748b' }}>
            <Image size={40} style={{ margin:'0 auto 0.75rem', opacity:0.3 }} />
            <p>No templates uploaded yet.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'1rem' }}>
            {templates.map(tmpl => (
              <div key={tmpl._id} className="card-hover" style={{
                background:'var(--bg-surface)', border:'1px solid var(--border-color)',
                borderRadius:12, overflow:'hidden'
              }}>
                <div style={{ height:160, overflow:'hidden', background:'#0f172a', position:'relative' }}>
                  <img
                    src={`/uploads/templates/${tmpl.filename}`}
                    alt={tmpl.originalName}
                    style={{ width:'100%', height:'100%', objectFit:'cover' }}
                  />
                  <div style={{ position:'absolute', top:'0.5rem', right:'0.5rem', zIndex:5 }}>
                    <span className="badge badge-primary" style={{ fontSize:'0.675rem', padding:'0.2rem 0.4rem', fontWeight:600 }}>
                      {tmpl.fontFamily} - {tmpl.fontSize}pt
                    </span>
                  </div>
                  <div style={{
                    position:'absolute', inset:0, background:'rgba(0,0,0,0)',
                    transition:'background 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem',
                    opacity:0, zIndex:10
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(0,0,0,0.5)'; e.currentTarget.style.opacity=1; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(0,0,0,0)'; e.currentTarget.style.opacity=0; }}
                  >
                    <button className="btn-secondary" style={{ padding:'0.375rem 0.75rem', fontSize:'0.75rem' }}
                      onClick={() => setPreview(tmpl)}>
                      <Eye size={14} /> Preview
                    </button>
                  </div>
                </div>
                <div style={{ padding:'0.875rem' }}>
                  <div style={{ fontWeight:500, color:'var(--text-title)', fontSize:'0.875rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:'0.375rem' }}>
                    {tmpl.originalName}
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>
                    By: <span style={{ fontWeight:500, color:'var(--text-title)' }}>{tmpl.uploadedBy?.name || 'System'}</span>
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span>{format(new Date(tmpl.createdAt), 'MMM d, yyyy')}</span>
                      <button className="btn-danger" style={{ padding:'0.375rem 0.75rem', fontSize:'0.75rem' }}
                        onClick={() => setTemplateToDelete(tmpl)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && <TemplatePreviewModal template={preview} onClose={() => setPreview(null)} />}
      {pendingFile && <UploadModal file={pendingFile} onClose={() => setPendingFile(null)} onUpload={handleUpload} uploading={uploading} />}
      {templateToDelete && (
        <ConfirmModal
          title="Delete Template"
          message={`Are you sure you want to permanently delete template "${templateToDelete.originalName}"?`}
          confirmText="Yes, Delete Template"
          onConfirm={handleDelete}
          onCancel={() => setTemplateToDelete(null)}
        />
      )}
    </DashboardLayout>
  );
}
