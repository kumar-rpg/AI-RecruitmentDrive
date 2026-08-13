'use client';

// "New" is the un-reviewed state — everything past it counts as reviewed, so
// the grey arc on the ring is exactly the portion still waiting on you.
// Pipeline order, so the ring reads left-to-right as a funnel.
const STATUS_META = [
  { key: 'New', color: 'var(--muted)' },
  { key: 'Reviewing', color: 'var(--accent)' },
  { key: 'Shortlisted', color: 'var(--accent2)' },
  { key: 'Interview', color: 'var(--interview)' },
  { key: 'Offered', color: 'var(--warn)' },
  { key: 'Hired', color: 'var(--hired)' },
  { key: 'Rejected', color: 'var(--danger)' },
];

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function StatsPanel({ applicants }) {
  const total = applicants.length;

  const counts = STATUS_META.map(({ key, color }) => ({
    key,
    color,
    count: applicants.filter((a) => a.status === key).length,
  }));

  const reviewed = total - counts[0].count;
  const reviewedPct = total ? Math.round((reviewed / total) * 100) : 0;

  // Each arc starts where the previous one ended, so the four segments wrap
  // the ring exactly once.
  let cursor = 0;
  const segments = counts.map((c) => {
    const length = total ? (c.count / total) * CIRCUMFERENCE : 0;
    const segment = { ...c, length, offset: cursor };
    cursor += length;
    return segment;
  });

  return (
    <div className="card">
      <label>Overview</label>
      <div className="stats-panel">
        <div className="gauge">
          <svg
            viewBox="0 0 130 130"
            role="img"
            aria-label={`${reviewed} of ${total} applicants reviewed (${reviewedPct}%)`}
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
                />
              ) : null
            )}
          </svg>
          <div className="gauge-center">
            <strong>{reviewed}</strong>
            <span>
              of {total} reviewed
            </span>
          </div>
        </div>

        <div className="stat-rows">
          <div className="stat-total">
            <span>Total Applicants</span>
            <strong>{total}</strong>
          </div>
          {counts.map((c) => {
            const pct = total ? Math.round((c.count / total) * 100) : 0;
            return (
              <div className="stat-row" key={c.key}>
                <span className="dot" style={{ background: c.color }} />
                <span className="stat-label">{c.key}</span>
                <span className="stat-count">{c.count}</span>
                <span className="stat-bar">
                  <span style={{ width: `${pct}%`, background: c.color }} />
                </span>
                <span className="stat-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
