'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormProgress from '@/components/ea/FormProgress';
import { saveDraft } from '@/lib/ea-actions';

const EMPTY_FAMILY = { name: '', relationship: '', age: '', employer: '' };
const EMPTY_JOB = {
  company: '', tel: '', business_type: '', position: '', department: '',
  from_date: '', to_date: '', salary_start: '', salary_current: '',
  benefits: '', reason_for_leaving: '',
};

function JobFields({ job, onChange, disabled }) {
  const f = (field) => (e) => onChange(field, e.target.value);
  return (
    <div>
      <div>
        <label>Company Name</label>
        <input type="text" value={job.company} disabled={disabled} onChange={f('company')} />
      </div>
      <div className="ea-grid-3">
        <div><label>Nature of Business</label>
          <input type="text" value={job.business_type} disabled={disabled} onChange={f('business_type')} /></div>
        <div><label>Position Held</label>
          <input type="text" value={job.position} disabled={disabled} onChange={f('position')} /></div>
        <div><label>Department</label>
          <input type="text" value={job.department} disabled={disabled} onChange={f('department')} /></div>
      </div>
      <div className="ea-grid-2">
        <div><label>From</label>
          <input type="date" value={job.from_date} disabled={disabled} onChange={f('from_date')} /></div>
        <div><label>To</label>
          <input type="date" value={job.to_date} disabled={disabled} onChange={f('to_date')} /></div>
      </div>
      <div className="ea-grid-2">
        <div><label>Starting Salary (RM)</label>
          <input type="number" value={job.salary_start} disabled={disabled} onChange={f('salary_start')} /></div>
        <div><label>Last / Current Salary (RM)</label>
          <input type="number" value={job.salary_current} disabled={disabled} onChange={f('salary_current')} /></div>
      </div>
      <div><label>Benefits / Allowances</label>
        <input type="text" value={job.benefits} disabled={disabled} onChange={f('benefits')} /></div>
      <div><label>Reason for Leaving</label>
        <input type="text" value={job.reason_for_leaving} disabled={disabled} onChange={f('reason_for_leaving')} /></div>
    </div>
  );
}

export default function EmploymentForm({ initialData }) {
  const router = useRouter();
  const isSubmitted = initialData?.status === 'submitted';

  const [family, setFamily] = useState(
    initialData?.family_members?.length ? initialData.family_members : [{ ...EMPTY_FAMILY }]
  );
  const [current, setCurrent] = useState(
    initialData?.current_employment && Object.keys(initialData.current_employment).length
      ? initialData.current_employment
      : { ...EMPTY_JOB }
  );
  const [previous, setPrevious] = useState(
    initialData?.previous_employment?.length ? initialData.previous_employment : []
  );

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  function setFamilyRow(idx, field, value) {
    setFamily((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function setPrevRow(idx, field, value) {
    setPrevious((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function setCurField(field, value) {
    setCurrent((c) => ({ ...c, [field]: value }));
  }

  async function handleSaveDraft() {
    setSaving(true);
    setSaveMsg('');
    const result = await saveDraft({
      family_members: family,
      current_employment: current,
      previous_employment: previous,
    });
    setSaving(false);
    setSaveMsg(result.error ? `Error: ${result.error}` : 'Draft saved.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  async function handleNext() {
    setSaving(true);
    await saveDraft({
      family_members: family,
      current_employment: current,
      previous_employment: previous,
    });
    setSaving(false);
    router.push('/ea/general');
  }

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <header className="page-header">
        <div>
          <h1>Employment Application</h1>
          <div className="sub">CORTEX ROBOTICS</div>
        </div>
      </header>

      <FormProgress step={3} submitted={isSubmitted} />

      {isSubmitted && (
        <div className="success-box" style={{ marginBottom: 16 }}>
          Your application has been submitted and is read-only.
        </div>
      )}

      {/* Family Information */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Family Information</h2>
          {!isSubmitted && family.length < 5 && (
            <button className="ghost" onClick={() => setFamily((r) => [...r, { ...EMPTY_FAMILY }])}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              + Add Member
            </button>
          )}
        </div>
        {family.map((row, i) => (
          <div key={i} className="ea-repeating-row">
            <div className="ea-grid-2">
              <div><label>Name</label>
                <input type="text" value={row.name} disabled={isSubmitted}
                  onChange={(e) => setFamilyRow(i, 'name', e.target.value)} /></div>
              <div><label>Relationship</label>
                <input type="text" value={row.relationship} disabled={isSubmitted}
                  onChange={(e) => setFamilyRow(i, 'relationship', e.target.value)} /></div>
            </div>
            <div className="ea-grid-2">
              <div><label>Age</label>
                <input type="number" value={row.age} disabled={isSubmitted}
                  onChange={(e) => setFamilyRow(i, 'age', e.target.value)} /></div>
              <div><label>Employer / School</label>
                <input type="text" value={row.employer} disabled={isSubmitted}
                  onChange={(e) => setFamilyRow(i, 'employer', e.target.value)} /></div>
            </div>
            {!isSubmitted && family.length > 1 && (
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <button className="ghost" onClick={() => setFamily((r) => r.filter((_, j) => j !== i))}
                  style={{ fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current Employment */}
      <div className="card">
        <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>Current Employment</h2>
        <JobFields job={current} onChange={setCurField} disabled={isSubmitted} />
      </div>

      {/* Previous Work History */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Previous Work History</h2>
          {!isSubmitted && previous.length < 4 && (
            <button className="ghost" onClick={() => setPrevious((r) => [...r, { ...EMPTY_JOB }])}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              + Add Employer
            </button>
          )}
        </div>
        {previous.length === 0 && <div className="empty">No previous employers added.</div>}
        {previous.map((job, i) => (
          <div key={i} className="ea-repeating-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <strong style={{ fontSize: '0.9rem' }}>Employer {i + 1}</strong>
              {!isSubmitted && (
                <button className="ghost" onClick={() => setPrevious((r) => r.filter((_, j) => j !== i))}
                  style={{ fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Remove
                </button>
              )}
            </div>
            <JobFields job={job} onChange={(field, val) => setPrevRow(i, field, val)} disabled={isSubmitted} />
          </div>
        ))}
      </div>

      {!isSubmitted ? (
        <div className="ea-form-actions">
          {saveMsg && <span className={saveMsg.startsWith('Error') ? 'err' : 'hint'}>{saveMsg}</span>}
          <button className="primary" onClick={handleSaveDraft} disabled={saving}
            style={{ background: '#FACC15', color: '#000', borderColor: '#FACC15' }}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="primary" onClick={() => router.push('/ea/education')} disabled={saving}>← Back</button>
          <button className="primary" onClick={handleNext} disabled={saving}>
            Next: General Info →
          </button>
        </div>
      ) : (
        <div className="ea-form-actions">
          <button className="primary" onClick={() => router.push('/ea/general')}>
            Next: General Info →
          </button>
        </div>
      )}
    </div>
  );
}
