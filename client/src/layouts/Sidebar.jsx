import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, CalendarDays, Image, FileText, Users, Mail,
  Award, ShieldCheck, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/supervisors', icon: Users, label: 'Supervisors' },
  { to: '/admin/certificates', icon: Image, label: 'Certificates' },
  { to: '/admin/repository', icon: Award, label: 'Repository' },
];

const supervisorLinks = [
  { to: '/supervisor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/supervisor/events', icon: CalendarDays, label: 'Events' },
  { to: '/supervisor/templates', icon: Image, label: 'Certificate Template' },
  { to: '/supervisor/email-templates', icon: Mail, label: 'Email Templates' },
  { to: '/supervisor/repository', icon: Award, label: 'Repository' },
];

export default function Sidebar() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = isAdmin ? adminLinks : supervisorLinks;

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn-secondary"
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 200, display: 'none', padding: '0.5rem' }}
        id="sidebar-toggle"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Award size={22} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>CARMS</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', lineHeight: 1 }}>Certificate System</div>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
          <div style={{
            background: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: '0.75rem',
            border: '1px solid rgba(99,102,241,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem', color: 'white', flexShrink: 0
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
                  <ShieldCheck size={11} color={isAdmin ? '#818cf8' : '#34d399'} />
                  <span style={{ fontSize: '0.7rem', color: isAdmin ? '#818cf8' : '#34d399', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
          <div style={{ padding: '0 0.75rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Navigation
          </div>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

      </aside>
    </>
  );
}
