import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LabPage from './pages/LabPage';
import WaitlistPage from './pages/WaitlistPage';
import AdminWaitlistPage from './pages/AdminWaitlistPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyber-green text-xl animate-pulse">Loading...</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cyber-green text-xl animate-pulse">Loading...</div>
      </div>
    );
  }
  return user ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/lab/:labId" element={<PrivateRoute><LabPage /></PrivateRoute>} />
      <Route path="/waitlist" element={<WaitlistPage />} />
      <Route path="/admin/waitlist" element={<AdminWaitlistPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
