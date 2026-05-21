import { useEffect, useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { Settings, Plus, Trash2, Folder, Calendar, FileText, AlertCircle, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import ConfirmModal from '../../components/ConfirmModal';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [projectToDelete, setProjectToDelete] = useState(null);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects || []);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      await api.post('/projects', form);
      toast.success('Project added successfully!');
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await api.delete(`/projects/${projectToDelete._id}`);
      toast.success('Project deleted successfully.');
      fetchProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setProjectToDelete(null);
    }
  };

  return (
    <DashboardLayout title="General Settings" subtitle="Configure system options and manage projects">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="settings-grid">
        {/* Responsive grid wrapper for Desktop */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .settings-grid {
              grid-template-columns: 350px 1fr !important;
            }
          }
        `}} />

        {/* Left Column - Add Project Form & Theme Settings */}
        <div>
          <div className="glass animate-slide-up" style={{ borderRadius: 16, padding: '1.5rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Folder size={18} color="#6366f1" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-title)' }}>Add New Project</h3>
            </div>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="label">Project Name</label>
                <input
                  className="input-field"
                  placeholder="e.g. ENGiRlss Portal"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Description (Optional)</label>
                <textarea
                  className="input-field"
                  style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Provide a brief summary of what this project is about..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                {submitting ? <div className="spinner" /> : <><Plus size={16} /> Add Project</>}
              </button>
            </form>
          </div>

          {/* Theme Preferences Card */}
          <div className="glass animate-slide-up" style={{ borderRadius: 16, padding: '1.5rem', height: 'fit-content', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Sun size={18} color="#6366f1" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-title)' }}>Theme Preferences</h3>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Choose your preferred appearance for the system interface.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1.25rem 1rem',
                  borderRadius: 12,
                  background: theme === 'dark' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: theme === 'dark' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                <Moon size={24} color={theme === 'dark' ? '#818cf8' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: theme === 'dark' ? 'var(--text-title)' : 'var(--text-muted)' }}>Dark Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1.25rem 1rem',
                  borderRadius: 12,
                  background: theme === 'light' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  border: theme === 'light' ? '2px solid #6366f1' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                <Sun size={24} color={theme === 'light' ? '#6366f1' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: theme === 'light' ? 'var(--text-title)' : 'var(--text-muted)' }}>Light Mode</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Project List */}
        <div>
          <div className="glass animate-slide-up" style={{ borderRadius: 16, padding: '1.5rem', minHeight: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={18} color="#6366f1" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-title)' }}>Existing Projects</h3>
              </div>
              <span className="badge badge-primary">{projects.length} project(s)</span>
            </div>

            {loading ? (
              <div style={{ padding: '1rem' }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8, marginBottom: '0.75rem' }} />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
                <Folder size={48} style={{ margin: '0 auto 1.25rem', opacity: 0.25 }} />
                <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem' }}>No projects registered</p>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>Use the form on the left to register your first system project.</p>
              </div>
            ) : (
              <div className="table-container" style={{ border: 'none', borderRadius: 12 }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '25%' }}>Project Name</th>
                      <th>Description</th>
                      <th style={{ width: '20%' }}>Created By</th>
                      <th style={{ width: '20%' }}>Date Created</th>
                      <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((proj) => (
                      <tr key={proj._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-title)' }}>
                            <Folder size={15} color="#818cf8" style={{ flexShrink: 0 }} />
                            <span>{proj.name}</span>
                          </div>
                        </td>
                        <td style={{ color: '#94a3b8', fontSize: '0.8125rem', maxHeight: '3rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {proj.description || <em style={{ opacity: 0.5 }}>No description provided.</em>}
                        </td>
                        <td style={{ color: '#cbd5e1', fontSize: '0.8125rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span className="badge badge-secondary" style={{ background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', fontWeight: 500 }}>
                              {proj.createdBy ? proj.createdBy.name : 'System'}
                            </span>
                          </div>
                        </td>
                        <td style={{ color: '#64748b', fontSize: '0.8125rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Calendar size={13} />
                            <span>{format(new Date(proj.createdAt), 'MMM d, yyyy')}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setProjectToDelete(proj)}
                            className="btn-danger"
                            style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {projectToDelete && (
        <ConfirmModal
          title="Delete Project"
          message={`Are you sure you want to delete the project "${projectToDelete.name}"? Superivsors currently assigned to this project will be updated to "No Project". This action cannot be undone.`}
          confirmText="Yes, Delete Project"
          onConfirm={handleDelete}
          onCancel={() => setProjectToDelete(null)}
        />
      )}
    </DashboardLayout>
  );
}
