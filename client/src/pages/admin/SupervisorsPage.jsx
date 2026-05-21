import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Users, Plus, Trash2, ToggleLeft, ToggleRight, AlertCircle, X, Mail, User, Lock, Folder } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../../components/ConfirmModal';

function Modal({ onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button onClick={onClose} style={{ float:'right', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}>
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', project:'' });
  const [submitting, setSubmitting] = useState(false);
  const [supervisorToDelete, setSupervisorToDelete] = useState(null);

  const fetchSupervisors = async () => {
    try {
      const { data } = await api.get('/users');
      setSupervisors(data.users.filter(u => u.role === 'supervisor'));
    } catch { toast.error('Failed to load supervisors'); }
    finally { setLoading(false); }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects || []);
    } catch {
      toast.error('Failed to load projects');
    }
  };

  useEffect(() => {
    fetchSupervisors();
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users/supervisor', form);
      toast.success('Supervisor created successfully!');
      setShowModal(false);
      setForm({ name:'', email:'', password:'', project:'' });
      fetchSupervisors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create supervisor');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!supervisorToDelete) return;
    try {
      await api.delete(`/users/${supervisorToDelete._id}`);
      toast.success('Supervisor deleted.');
      fetchSupervisors();
    } catch { toast.error('Failed to delete supervisor'); }
    finally { setSupervisorToDelete(null); }
  };

  const handleToggle = async (id) => {
    try {
      const { data } = await api.patch(`/users/${id}/toggle-status`);
      toast.success(data.message);
      fetchSupervisors();
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <DashboardLayout title="Supervisor Management" subtitle="Manage system supervisors">
      <div style={{ marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Users size={20} color="#6366f1" />
          <span style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>{supervisors.length} supervisor(s)</span>
        </div>
        <button id="add-supervisor-btn" className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Supervisor
        </button>
      </div>

      <div className="glass" style={{ borderRadius:16, overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:'2rem' }}>
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height:60, borderRadius:8, marginBottom:'0.75rem' }} />)}
          </div>
        ) : supervisors.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'#64748b' }}>
            <Users size={40} style={{ margin:'0 auto 1rem', opacity:0.3 }} />
            <p>No supervisors found. Add your first supervisor.</p>
          </div>
        ) : (
          <div className="table-container" style={{ border:'none', borderRadius:0 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {supervisors.map(sv => (
                  <tr key={sv._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        <div style={{
                          width:34, height:34, borderRadius:'50%', flexShrink:0,
                          background:'linear-gradient(135deg,#10b981,#059669)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:700, fontSize:'0.875rem', color:'white',
                          overflow: 'hidden'
                        }}>
                          {sv.avatar ? (
                            <img src={`/uploads/avatars/${sv.avatar}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            sv.name[0].toUpperCase()
                          )}
                        </div>
                        <span style={{ fontWeight:500, color:'var(--text-title)' }}>{sv.name}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--text-muted)' }}>{sv.email}</td>
                    <td>
                      {sv.project ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#818cf8', fontWeight: 500 }}>
                          <Folder size={14} />
                          <span>{sv.project.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.8125rem' }}>No Project</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${sv.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {sv.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color:'var(--text-muted)' }}>{format(new Date(sv.createdAt), 'MMM d, yyyy')}</td>
                    <td>
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        <button onClick={() => handleToggle(sv._id)}
                          className="btn-secondary" style={{ padding:'0.375rem 0.75rem', fontSize:'0.75rem' }}>
                          {sv.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          {sv.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setSupervisorToDelete(sv)} className="btn-danger" style={{ padding:'0.375rem 0.75rem', fontSize:'0.75rem' }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h3 style={{ fontSize:'1.125rem', fontWeight:700, color:'var(--text-title)', marginBottom:'1.5rem' }}>Add New Supervisor</h3>
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom:'1rem' }}>
              <label className="label">Full Name</label>
              <div style={{ position:'relative' }}>
                <User size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
                <input className="input-field" style={{ paddingLeft:'2.5rem' }} placeholder="Juan Dela Cruz"
                  value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
              </div>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label className="label">Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
                <input className="input-field" type="email" style={{ paddingLeft:'2.5rem' }} placeholder="supervisor@example.com"
                  value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
              </div>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label className="label">Assign Project (Optional)</label>
              <div style={{ position:'relative' }}>
                <Folder size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
                <select 
                  className="input-field" 
                  style={{ paddingLeft:'2.5rem' }}
                  value={form.project} 
                  onChange={e => setForm({...form, project:e.target.value})}
                >
                  <option value="">None (No Project)</option>
                  {projects.map(proj => (
                    <option key={proj._id} value={proj._id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:'1.5rem' }}>
              <label className="label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:'0.875rem', top:'50%', transform:'translateY(-50%)', color:'#475569' }} />
                <input className="input-field" type="password" style={{ paddingLeft:'2.5rem' }} placeholder="Min. 6 characters"
                  value={form.password} onChange={e => setForm({...form, password:e.target.value})} required minLength={6} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? <div className="spinner" /> : <><Plus size={15} /> Create Supervisor</>}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {supervisorToDelete && (
        <ConfirmModal
          title="Delete Supervisor"
          message={`Are you sure you want to permanently delete supervisor "${supervisorToDelete.name}"? This action cannot be undone.`}
          confirmText="Yes, Delete Supervisor"
          onConfirm={handleDelete}
          onCancel={() => setSupervisorToDelete(null)}
        />
      )}
    </DashboardLayout>
  );
}
