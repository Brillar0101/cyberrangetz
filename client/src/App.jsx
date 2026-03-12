import { Routes, Route, Navigate } from 'react-router-dom';
import WaitlistPage from './pages/WaitlistPage';
import AdminWaitlistPage from './pages/AdminWaitlistPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WaitlistPage />} />
      <Route path="/admin/waitlist" element={<AdminWaitlistPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
