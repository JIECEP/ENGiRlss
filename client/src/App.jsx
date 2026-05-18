import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import SupervisorsPage from './pages/admin/SupervisorsPage';
import AdminTemplatesPage from './pages/admin/AdminTemplatesPage';
import SupervisorDashboard from './pages/supervisor/SupervisorDashboard';
import TemplatesPage from './pages/supervisor/TemplatesPage';
import EmailTemplatesPage from './pages/supervisor/EmailTemplatesPage';
import CertificatesGeneratorPage from './pages/supervisor/CertificatesGeneratorPage';
import RepositoryPage from './pages/supervisor/RepositoryPage';
import EventsPage from './pages/supervisor/EventsPage';
import EventDetailPage from './pages/supervisor/EventDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(15,23,42,0.95)',
              backdropFilter: 'blur(10px)',
              color: '#f1f5f9',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '16px',
              boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0f172a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/supervisors" element={
            <ProtectedRoute allowedRoles={['admin']}><SupervisorsPage /></ProtectedRoute>
          } />
          <Route path="/admin/certificates" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminTemplatesPage /></ProtectedRoute>
          } />
          <Route path="/admin/repository" element={
            <ProtectedRoute allowedRoles={['admin']}><RepositoryPage /></ProtectedRoute>
          } />

          {/* Supervisor */}
          <Route path="/supervisor/dashboard" element={
            <ProtectedRoute allowedRoles={['supervisor']}><SupervisorDashboard /></ProtectedRoute>
          } />
          <Route path="/supervisor/templates" element={
            <ProtectedRoute allowedRoles={['supervisor']}><TemplatesPage /></ProtectedRoute>
          } />
          <Route path="/supervisor/email-templates" element={
            <ProtectedRoute allowedRoles={['supervisor']}><EmailTemplatesPage /></ProtectedRoute>
          } />
          <Route path="/supervisor/certificates" element={
            <ProtectedRoute allowedRoles={['supervisor']}><CertificatesGeneratorPage /></ProtectedRoute>
          } />
          <Route path="/supervisor/repository" element={
            <ProtectedRoute allowedRoles={['supervisor']}><RepositoryPage /></ProtectedRoute>
          } />
          <Route path="/supervisor/events" element={
            <ProtectedRoute allowedRoles={['supervisor']}><EventsPage /></ProtectedRoute>
          } />
          <Route path="/supervisor/events/:id" element={
            <ProtectedRoute allowedRoles={['supervisor']}><EventDetailPage /></ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
