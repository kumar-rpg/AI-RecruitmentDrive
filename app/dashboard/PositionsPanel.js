'use client';

// Applications per position: a magnitude comparison across nominal categories,
// so it's a ranked bar list in ONE hue — bar length carries the number. A donut
// was the wrong form here: positions are admin-created and unbounded, and any
// categorical palette runs out at eight.
//
// Bar length and the percentage are both share-of-total, so the two never
// disagree with each other.
export default function PositionsPanel({ applicants, positions }) {
  const total = applicants.length;

  const counts = new Map();
  for (const a of applicants) {
    const key = a.position?.trim() || 'Unspecified';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Current positions, plus any title still attached to an applicant whose
  // position has since been deleted — otherwise those applications would
  // silently vanish from the breakdown while still counting in the total.
  const known = new Set(positions.map((p) => p.title));
  const rows = [
    ...positions.map((p) => ({
      key: p.id,
      title: p.title,
      count: counts.get(p.title) ?? 0,
      isActive: p.is_active,
      removed: false,
    })),
    ...[...counts.keys()]
      .filter((t) => !known.has(t))
      .map((t) => ({
        key: `removed:${t}`,
        title: t,
        count: counts.get(t),
        isActive: false,
        removed: true,
      })),
  ];

  rows.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));

  const receiving = rows.filter((r) => r.count > 0).length;

  return (
    <div className="card">
      <label>Applications by Position</label>

      <div className="pos-total">
        <span>
          {receiving} of {rows.length} position{rows.length === 1 ? '' : 's'} receiving
          applications
        </span>
        <strong>{total}</strong>
      </div>

      {rows.length === 0 ? (
        <div className="empty">No positions yet — add one above.</div>
      ) : (
        <div className="pos-rows">
          {rows.map((r) => {
            const pct = total ? (r.count / total) * 100 : 0;
            const label = `${r.title}: ${r.count} of ${total} application${
              total === 1 ? '' : 's'
            } (${Math.round(pct)}%)`;
            return (
              <div className="pos-row" key={r.key} title={label}>
                <span className="pos-name">
                  {r.title}
                  {r.removed ? (
                    <span className="pill na">Removed</span>
                  ) : !r.isActive ? (
                    <span className="pill na">Closed</span>
                  ) : null}
                </span>
                <span className="pos-count">{r.count}</span>
                <span className="pos-bar">
                  <span
                    className={r.isActive ? '' : 'dim'}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="pos-pct">{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
