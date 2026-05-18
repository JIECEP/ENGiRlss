import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children, title, subtitle }) {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <div className="page-content" style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <Header title={title} subtitle={subtitle} />
        <main style={{ flex:1, padding:'2rem', overflowY:'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
