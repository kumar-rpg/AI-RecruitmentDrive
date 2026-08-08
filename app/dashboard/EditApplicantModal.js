'use client';

import { useEffect, useState } from 'react';
import {
  sanitizeName,
  formatPhone,
  validateApplicant,
  monthsBetween,
  formatDuration,
} from '@/lib/validation';
import { updateApplicant } from './actions';

const CATEGORIES = [
  { val: 'intern', label: 'Studying — Intern' },
  { val: 'grad', label: 'Studying — Graduating / Job-seeking' },
  { val: 'working', label: 'Already Working' },
];

export default function EditApplicantModal({ applicant, positions, onSaved, onClose }) {
  const [form, setForm] = useState({
    name: applicant.name ?? '',
    email: applicant.email ?? '',
    phone: applicant.phone ?? '',
    position: applicant.position ?? '',
    category: applicant.category ?? '',
    org: applicant.org ?? '',
    program: applicant.program_or_role ?? '',
    internStart: applicant.internship_start_date ?? '',
    internEnd: applicant.internship_end_date ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isWorking = form.category === 'working';
  const isIntern = form.category === 'intern';
  const internDuration = monthsBetween(form.internStart, form.internEnd);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // The record may predate a position being renamed or removed. Keep whatever
  // it currently holds selectable so opening the dialog can never silently
  // reassign someone just because their role is no longer on the list.
  const orphanPosition =
    form.position && !positions.some((p) => p.title === form.position) ? form.position : null;

  function setCategory(val) {
    setForm((f) => ({
      ...f,
      category: val,
      org: val === 'working' ? '' : f.org,
      program: val === 'working' ? '' : f.program,
      internStart: val === 'intern' ? f.internStart : '',
      internEnd: val === 'intern' ? f.internEnd : '',
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const problem = validateApplicant(form);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    try {
      await updateApplicant(applicant.id, form);
      onSaved({
        ...applicant,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        position: form.position.trim(),
        category: form.category,
        org: isWorking ? '' : form.org.trim(),
        program_or_role: isWorking ? '' : form.program.trim(),
        internship_start_date: isIntern ? form.internStart : null,
        internship_end_date: isIntern ? form.internEnd : null,
        internship_duration_months: isIntern ? internDuration?.months ?? null : null,
      });
    } catch (err) {
      setError(err.message || 'Could not save changes.');
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${applicant.name}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal-card" onSubmit={handleSubmit}>
        <div className="modal-head">
          <strong>Edit Applicant</strong>
          <button className="ghost" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <label>Full Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: sanitizeName(e.target.value) })}
        />

        <label>Email Address</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <label>Mobile No.</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 016-4028507"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
        />

        <label>Position</label>
        <select
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
        >
          <option value="" disabled>
            Select a position…
          </option>
          {orphanPosition && (
            <option value={orphanPosition}>{orphanPosition} (no longer on record)</option>
          )}
          {positions.map((p) => (
            <option key={p.id} value={p.title}>
              {p.title}
              {p.is_active ? '' : ' (closed)'}
            </option>
          ))}
        </select>

        <label>Category</label>
        <select value={form.category} onChange={(e) => setCategory(e.target.value)}>
          <option value="" disabled>
            Select a category…
          </option>
          {CATEGORIES.map((c) => (
            <option key={c.val} value={c.val}>
              {c.label}
            </option>
          ))}
        </select>

        {isIntern && (
          <>
            <label>Internship Start Date</label>
            <input
              type="date"
              value={form.internStart}
              onChange={(e) => setForm({ ...form, internStart: e.target.value })}
            />
            <label>Internship End Date</label>
            <input
              type="date"
              value={form.internEnd}
              onChange={(e) => setForm({ ...form, internEnd: e.target.value })}
            />

            <label>Internship Duration</label>
            <input
              type="text"
              value={form.internStart && form.internEnd ? formatDuration(internDuration) : ''}
              placeholder="Calculated automatically from the dates above"
              readOnly
              disabled
            />
          </>
        )}

        {!isWorking && (
          <>
            <label>University</label>
            <input
              type="text"
              value={form.org}
              onChange={(e) => setForm({ ...form, org: e.target.value })}
            />
            <label>Program</label>
            <input
              type="text"
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
            />
          </>
        )}

        <div className="hint" style={{ marginTop: '14px' }}>
          Uploaded documents and the submission date can&apos;t be changed here. Status stays on
          the table.
        </div>

        {error && <div className="err">{error}</div>}

        <div className="modal-actions">
          <button className="ghost" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="primary" type="submit" disabled={saving} style={{ marginTop: 0 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
