'use client';

import ThemeToggle from '@/components/ThemeToggle';

const STATUSES = [
  { key: 'New', color: 'var(--muted)' },
  { key: 'Reviewing', color: 'var(--accent)' },
  { key: 'Shortlisted', color: 'var(--accent2)' },
  { key: 'Interview', color: 'var(--interview)' },
  { key: 'Offered', color: 'var(--warn)' },
  { key: 'Hired', color: 'var(--hired)' },
  { key: 'Rejected', color: 'var(--danger)' },
  { key: 'Declined', color: 'var(--danger)' },
  { key: 'KIV', color: 'var(--accent)' },
];

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MobileDashboard({ applicants, statuses }) {
  const total = applicants.length;
  const reviewed = total - statuses.New;
  const reviewedPct = total ? Math.round((reviewed / total) * 100) : 0;

  const counts = STATUSES.map(({ key, color }) => ({
    key,
    color,
    count: statuses[key] || 0,
  }));

  let cursor = 0;
  const segments = counts.map((c) => {
    const length = total ? (c.count / total) * CIRCUMFERENCE : 0;
    const segment = { ...c, length, offset: cursor };
    cursor += length;
    return segment;
  });

  return (
    <div className="mobile-dashboard">
      <header className="mobile-header">
        <div>
          <h1>CORTEX ROBOTICS</h1>
          <div className="sub">Mobile Dashboard</div>
        </div>
        <ThemeToggle />
      </header>

      <div className="mobile-wrap">
        <div className="mobile-overview">
          <h2>Overview</h2>

          <div className="mobile-gauge">
            <svg
              viewBox="0 0 130 130"
              role="img"
              aria-label={`${reviewed} of ${total} applicants reviewed (${reviewedPct}%)`}
              className="gauge-svg"
            >
              <circle className="gauge-track" cx="65" cy="65" r={RADIUS} />
              {segments.map((s) =>
                s.count > 0 ? (
                  <circle
                    key={s.key}
                    cx="65"
                    cy="65"
                    r={RADIUS}
                    stroke={s.color}
                    strokeDasharray={`${s.length} ${CIRCUMFERENCE - s.length}`}
                    strokeDashoffset={-s.offset}
                    className="gauge-segment"
                  />
                ) : null
              )}
            </svg>
            <div className="gauge-center">
              <strong>{reviewed}</strong>
              <span>of {total}</span>
            </div>
          </div>

          <div className="mobile-stats">
            <div className="stat-total">
              <span>Total Applicants</span>
              <strong>{total}</strong>
            </div>

            {counts.map((c) => {
              const pct = total ? Math.round((c.count / total) * 100) : 0;
              return (
                <div className="mobile-stat-row" key={c.key}>
                  <span className="dot" style={{ background: c.color }} />
                  <span className="label">{c.key}</span>
                  <span className="count">{c.count}</span>
                  <span className="pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
