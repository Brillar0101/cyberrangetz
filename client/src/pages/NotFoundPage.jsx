import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#050505',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: 32 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: '#1EB53A', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8, marginBottom: 8 }}>Page not found</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            background: '#1EB53A',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
