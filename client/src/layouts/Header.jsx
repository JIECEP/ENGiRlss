import { LogOut, User as UserIcon, X, AlertTriangle, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function Header({ title, subtitle }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <header style={{
        height:70, background:'var(--header-bg)', borderBottom:'1px solid var(--border-color)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 2rem', position:'sticky', top:0, zIndex:50,
        backdropFilter:'blur(12px)'
      }}>
        <div>
          <h1 style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--text-title)', lineHeight:1.2 }}>{title}</h1>
          {subtitle && <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.125rem' }}>{subtitle}</p>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--search-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              width: 38,
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.2s',
              padding: 0
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
              e.currentTarget.style.borderColor = '#6366f1';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--search-bg)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            {theme === 'light' ? <Moon size={18} color="#6366f1" /> : <Sun size={18} color="#f59e0b" />}
          </button>

          <div style={{ position:'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                width:38, height:38, borderRadius:'50%', border:'none',
                background:'linear-gradient(135deg,#6366f1,#818cf8)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, fontSize:'1rem', color:'white', cursor:'pointer',
                transition:'transform 0.2s', padding:0,
                boxShadow: showDropdown ? '0 0 0 3px rgba(99,102,241,0.3)' : 'none',
                overflow: 'hidden'
              }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >
              {user?.avatar ? (
                <img src={`/uploads/avatars/${user.avatar}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </button>

            {showDropdown && (
              <div style={{
                position:'absolute', top:'calc(100% + 0.5rem)', right:0,
                background:'var(--dropdown-bg)', border:'1px solid var(--border-color)',
                borderRadius:12, minWidth:200, padding:'0.5rem',
                boxShadow:'0 10px 25px rgba(0,0,0,0.5)', zIndex:100,
                animation:'slideUp 0.15s ease'
              }}>
                <div style={{ padding:'0.5rem 0.75rem', borderBottom:'1px solid var(--border-color)', marginBottom:'0.5rem' }}>
                  <div style={{ fontWeight:600, color:'var(--text-title)', fontSize:'0.875rem' }}>{user?.name}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{user?.email}</div>
                </div>
                <button
                  style={{
                    width:'100%', display:'flex', alignItems:'center', gap:'0.75rem',
                    padding:'0.625rem 0.75rem', background:'transparent', border:'none',
                    borderRadius:8, color:'#ef4444', fontSize:'0.875rem', fontWeight:500,
                    cursor:'pointer', transition:'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  onClick={() => {
                    setShowDropdown(false);
                    setShowLogoutModal(true);
                  }}
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showLogoutModal && (
        <div className="modal-overlay" style={{ zIndex:200 }}>
          <div className="modal-box" style={{ maxWidth:400, textAlign:'center', padding:'2rem' }}>
            <div style={{
              width:64, height:64, borderRadius:'50%', background:'rgba(239,68,68,0.1)',
              display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem'
            }}>
              <LogOut size={32} color="#ef4444" />
            </div>
            <h3 style={{ fontSize:'1.25rem', fontWeight:700, color:'#f1f5f9', marginBottom:'0.5rem' }}>Ready to Leave?</h3>
            <p style={{ color:'#94a3b8', fontSize:'0.875rem', marginBottom:'2rem' }}>
              Are you sure you want to log out of your session?
            </p>
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
              <button className="btn-secondary" style={{ flex:1 }} onClick={() => setShowLogoutModal(false)}>
                Cancel
              </button>
              <button className="btn-danger" style={{ flex:1 }} onClick={handleLogout}>
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
