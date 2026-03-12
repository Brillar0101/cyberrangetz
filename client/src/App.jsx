import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

const WaitlistPage = lazy(() => import('./pages/WaitlistPage'));
const AdminWaitlistPage = lazy(() => import('./pages/AdminWaitlistPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const Loading = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#050505',
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'system-ui, sans-serif',
    fontSize: 14,
  }}>
    Loading...
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<WaitlistPage />} />
          <Route path="/admin/waitlist" element={<AdminWaitlistPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
