'use client';

import Link from 'next/link';

const STEPS = [
  { step: 1, label: 'Personal', href: '/ea/personal' },
  { step: 2, label: 'Education', href: '/ea/education' },
  { step: 3, label: 'Employment', href: '/ea/employment' },
  { step: 4, label: 'General', href: '/ea/general' },
  { step: 5, label: 'Referees', href: '/ea/referees' },
  { step: 6, label: 'Declaration', href: '/ea/declaration' },
];

export default function FormProgress({ step: current, submitted }) {
  return (
    <div className="ea-progress">
      <div className="ea-progress-bar">
        <div
          className="ea-progress-fill"
          style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
      <div className="ea-progress-steps">
        {STEPS.map(({ step, label, href }) => {
          const done = step < current;
          const active = step === current;
          return (
            <div key={step} className={`ea-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
              {done && !submitted ? (
                <Link href={href} className="ea-step-dot">
                  ✓
                </Link>
              ) : (
                <span className="ea-step-dot">{step}</span>
              )}
              <span className="ea-step-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
