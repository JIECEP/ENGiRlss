import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, User, Upload, Shield, Activity, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    // Fetch activity logs
    const fetchLogs = async () => {
      try {
        const res = await api.get('/users/activity-log');
        if (res.data.success) setActivityLogs(res.data.logs);
      } catch (err) { console.error('Failed to load logs'); }
    };
    fetchLogs();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
    setLoading(true);
    try {
      const res = await api.put('/users/profile', { currentPassword, newPassword });
      if (res.data.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally { setLoading(false); }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatar) return toast.error('Please select an image first.');
    setLoading(true);
    const formData = new FormData();
    formData.append('avatar', avatar);
    try {
      const res = await api.put('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Avatar updated!');
        const updatedUser = { ...user, avatar: res.data.avatar };
        setUser(updatedUser);
        localStorage.setItem('carms_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setLoading(false); }
  };

  return (
    <DashboardLayout title="Account Settings" subtitle="Manage your profile and security">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Profile & Avatar */}
        <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <User size={18} color="#6366f1" />
            <span style={{ fontWeight: 600 }}>Profile Picture</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '2rem', color: 'white', overflow: 'hidden'
            }}>
              {avatarPreview ? (
                <img src={avatarPreview.startsWith('blob:') ? avatarPreview : `/uploads/avatars/${avatarPreview}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} id="avatar-input" />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label htmlFor="avatar-input" className="btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={14} /> Browse
              </label>
              <button className="btn-primary" onClick={handleUploadAvatar} disabled={loading || !avatar}>
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Shield size={18} color="#6366f1" />
            <span style={{ fontWeight: 600 }}>Account Details</span>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="label">Name</label>
              <div>{user?.name}</div>
            </div>
            <div>
              <label className="label">Email</label>
              <div>{user?.email}</div>
            </div>
            <div>
              <label className="label">Role</label>
              <span className="badge badge-primary">{user?.role}</span>
            </div>
            <div>
              <label className="label">Joined</label>
              <div>{user?.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Lock size={18} color="#6366f1" />
            <span style={{ fontWeight: 600 }}>Security</span>
          </div>
          <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label className="label">Current Password</label>
              <input className="input-field" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label className="label">New Password</label>
              <input className="input-field" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input className="input-field" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              Update Password
            </button>
          </form>
        </div>

        {/* Theme Preferences */}
        <div className="glass" style={{ borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Sun size={18} color="#6366f1" />
            <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>Theme Preferences</span>
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

      {/* Activity Log */}
      <div className="glass" style={{ borderRadius: 16, padding: '1.5rem', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Activity size={18} color="#6366f1" />
          <span style={{ fontWeight: 600 }}>Recent Activity</span>
        </div>
        {activityLogs.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>No recent activity</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map(log => (
                  <tr key={log._id}>
                    <td>{log.action}</td>
                    <td>{log.ip || 'N/A'}</td>
                    <td>{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}</td>
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
