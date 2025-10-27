import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404 - Page Not Found</h1>
      <p style={{ marginTop: '1rem' }}>Could not find the requested page.</p>
      <Link href="/workshops" style={{ marginTop: '1.5rem', color: 'blue', textDecoration: 'underline' }}>
        Return to Workshop Selection
      </Link>
    </div>
  );
}