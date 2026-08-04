import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export const metadata = {
  title: 'Application Received — CORTEX ROBOTICS',
};

export default function ThankYouPage() {
  return (
    <div className="wrap narrow">
      <header className="page-header">
        <div>
          <h1>CORTEX ROBOTICS</h1>
          <div className="sub">Internship / Recruitment Drive</div>
        </div>
        <ThemeToggle />
      </header>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✅</div>
        <h1 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>
          Thank you for applying!
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '4px' }}>
          Your application has been received.
        </p>
        <p style={{ color: 'var(--muted)', marginBottom: '4px' }}>
          We will get back to you as soon as possible.
        </p>
        <p style={{ color: 'var(--muted)' }}>
          Please keep an eye on your inbox (and spam folder, just in case) for
          a response from our team.
        </p>

        <Link href="/" className="ghost-link" style={{ marginTop: '20px', display: 'inline-block' }}>
          Submit another application
        </Link>
      </div>
    </div>
  );
}
