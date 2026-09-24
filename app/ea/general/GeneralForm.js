'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormProgress from '@/components/ea/FormProgress';
import { saveDraft, signOutApplicant } from '@/lib/ea-actions';

const VACANCY_SOURCES = [
  { value: 'newspaper', label: 'Newspaper' },
  { value: 'internet', label: 'Internet / Job Portal' },
  { value: 'employee_referral', label: 'Employee Referral' },
  { value: 'recruitment_agency', label: 'Recruitment Agency' },
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'others', label: 'Others' },
];

const EMPTY_CONNECTION = { name: '', relationship: '', department: '', position: '' };

export default function GeneralForm({ initialData }) {
  const router = useRouter();
  const isSubmitted = initialData?.status === 'submitted';
  const isInternship = /\bintern(ship)?\b/i.test(initialData?.position_applied || '');

  const [form, setForm] = useState({
    expected_salary: initialData?.expected_salary ?? '',
    notice_period_months: initialData?.notice_period_months ?? '',
    expected_join_date: initialData?.expected_join_date ?? '',
    vacancy_source: initialData?.vacancy_source || [],
    vacancy_source_employee_name: initialData?.vacancy_source_employee_name || '',
    vacancy_source_agency: initialData?.vacancy_source_agency || '',
    criminal_conviction: initialData?.criminal_conviction ?? null,
    criminal_conviction_details: initialData?.criminal_conviction_details || '',
    health_condition: initialData?.health_condition ?? null,
    health_condition_details: initialData?.health_condition_details || '',
    is_pregnant: initialData?.is_pregnant ?? null,
    pregnancy_due_date: initialData?.pregnancy_due_date || '',
    cortex_connections: initialData?.cortex_connections || [],
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  function setNoticePeriod(months) {
    const update = { notice_period_months: months };
    const m = parseInt(months, 10);
    if (!isNaN(m) && m >= 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + m);
      update.expected_join_date = d.toISOString().slice(0, 10);
    }
    setForm((f) => ({ ...f, ...update }));
    if (errors.notice_period_months) setErrors((e) => ({ ...e, notice_period_months: '' }));
  }

  function validate() {
    const errs = {};
    if (isInternship) return errs;
    if (!form.expected_salary && form.expected_salary !== 0) errs.expected_salary = 'This field is required';
    if (form.notice_period_months === '' || form.notice_period_months === null || form.notice_period_months === undefined) {
      errs.notice_period_months = 'This field is required';
    }
    return errs;
  }

  function toggleSource(val) {
    set('vacancy_source',
      form.vacancy_source.includes(val)
        ? form.vacancy_source.filter((v) => v !== val)
        : [...form.vacancy_source, val]
    );
  }

  function setConnection(idx, field, value) {
    set('cortex_connections',
      form.cortex_connections.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  }

  function cleanForm() {
    return {
      ...form,
      expected_join_date:   form.expected_join_date   || null,
      pregnancy_due_date:   form.pregnancy_due_date   || null,
      expected_salary:      form.expected_salary !== '' ? form.expected_salary : null,
      notice_period_months: form.notice_period_months !== '' ? form.notice_period_months : null,
    };
  }

  async function handleSaveDraft() {
    setSaving(true);
    setSaveMsg('');
    const result = await saveDraft(cleanForm());
    setSaving(false);
    setSaveMsg(result.error ? `Error: ${result.error}` : 'Draft saved.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  async function handleNext() {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    await saveDraft(cleanForm());
    setSaving(false);
    router.push('/ea/referees');
  }

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <header className="page-header">
        <div>
          <h1>Employment Application</h1>
          <div className="sub">CORTEX ROBOTICS</div>
        </div>
        <button className="ghost" disabled={saving} style={{ whiteSpace: 'nowrap' }}
          onClick={async () => {
            if (!isSubmitted) { setSaving(true); await saveDraft(cleanForm()); }
            await signOutApplicant();
          }}>
          {saving ? 'Saving…' : 'Sign Out'}
        </button>
      </header>

      <FormProgress step={4} submitted={isSubmitted} />

      {isSubmitted && (
        <div className="success-box" style={{ marginBottom: 16 }}>
          Your application has been submitted and is read-only.
        </div>
      )}

      <div className="card">
        <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>General Information</h2>

        {!isInternship && <div className="ea-grid-3">
          <div>
            <label>Expected Monthly Salary (RM) <span className="ea-req">*</span></label>
            <input type="number" value={form.expected_salary} disabled={isSubmitted}
              onChange={(e) => set('expected_salary', e.target.value)} />
            {errors.expected_salary && <div className="err">{errors.expected_salary}</div>}
          </div>
          <div>
            <label>Notice Period (months) <span className="ea-req">*</span></label>
            <input type="number" value={form.notice_period_months} disabled={isSubmitted} min={0}
              onChange={(e) => setNoticePeriod(e.target.value)} />
            {errors.notice_period_months && <div className="err">{errors.notice_period_months}</div>}
          </div>
          <div>
            <label>Expected Join Date</label>
            <input type="date" value={form.expected_join_date} disabled={isSubmitted}
              onChange={(e) => set('expected_join_date', e.target.value)} />
            <div className="hint" style={{ fontSize: '0.75rem', marginTop: 2 }}>Auto-calculated from notice period. You may adjust.</div>
          </div>
        </div>}

        <label>How did you hear about this vacancy?</label>
        <div className="ea-checkbox-group">
          {VACANCY_SOURCES.map(({ value, label }) => (
            <label key={value} className={`ea-checkbox-item ${form.vacancy_source.includes(value) ? 'checked' : ''}`}>
              <input type="checkbox" checked={form.vacancy_source.includes(value)} disabled={isSubmitted}
                onChange={() => toggleSource(value)} />
              {label}
            </label>
          ))}
        </div>

        {form.vacancy_source.includes('employee_referral') && (
          <div style={{ marginTop: 10 }}>
            <label>Employee Name (referral)</label>
            <input type="text" value={form.vacancy_source_employee_name} disabled={isSubmitted}
              onChange={(e) => set('vacancy_source_employee_name', e.target.value)} />
          </div>
        )}
        {form.vacancy_source.includes('recruitment_agency') && (
          <div style={{ marginTop: 10 }}>
            <label>Agency Name</label>
            <input type="text" value={form.vacancy_source_agency} disabled={isSubmitted}
              onChange={(e) => set('vacancy_source_agency', e.target.value)} />
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <label>Have you ever been convicted of any criminal offence?</label>
          <div className="radio-row" style={{ marginTop: 8 }}>
            {[{ val: true, lbl: 'Yes' }, { val: false, lbl: 'No' }].map(({ val, lbl }) => (
              <label key={lbl} className={`option ${form.criminal_conviction === val ? 'picked' : ''}`}>
                <input type="radio" checked={form.criminal_conviction === val} disabled={isSubmitted}
                  onChange={() => set('criminal_conviction', val)} />
                {lbl}
              </label>
            ))}
          </div>
          {form.criminal_conviction === true && (
            <div style={{ marginTop: 10 }}>
              <label>Please provide details</label>
              <input type="text" value={form.criminal_conviction_details} disabled={isSubmitted}
                onChange={(e) => set('criminal_conviction_details', e.target.value)} />
            </div>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <label>Do you have any health condition that may affect your work performance?</label>
          <div className="radio-row" style={{ marginTop: 8 }}>
            {[{ val: 'yes', lbl: 'Yes' }, { val: 'no', lbl: 'No' }].map(({ val, lbl }) => (
              <label key={lbl} className={`option ${form.health_condition === val ? 'picked' : ''}`}>
                <input type="radio" checked={form.health_condition === val} disabled={isSubmitted}
                  onChange={() => set('health_condition', val)} />
                {lbl}
              </label>
            ))}
          </div>
          {form.health_condition === 'yes' && (
            <div style={{ marginTop: 10 }}>
              <label>Please describe the condition</label>
              <input type="text" value={form.health_condition_details} disabled={isSubmitted}
                onChange={(e) => set('health_condition_details', e.target.value)} />
            </div>
          )}
        </div>

        <div style={{ marginTop: 20 }}>
          <label>Are you currently pregnant? <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>(Female applicants)</span></label>
          <div className="radio-row" style={{ marginTop: 8 }}>
            {[{ val: true, lbl: 'Yes' }, { val: false, lbl: 'No' }, { val: null, lbl: 'N/A' }].map(({ val, lbl }) => (
              <label key={lbl} className={`option ${form.is_pregnant === val ? 'picked' : ''}`}>
                <input type="radio" checked={form.is_pregnant === val} disabled={isSubmitted}
                  onChange={() => set('is_pregnant', val)} />
                {lbl}
              </label>
            ))}
          </div>
          {form.is_pregnant === true && (
            <div style={{ marginTop: 10 }}>
              <label>Expected Due Date</label>
              <input type="date" value={form.pregnancy_due_date} disabled={isSubmitted}
                onChange={(e) => set('pregnancy_due_date', e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* Cortex Connections */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>Connections at Cortex Robotics</h2>
            <p className="hint" style={{ margin: 0 }}>Do you have any relatives or friends working here?</p>
          </div>
          {!isSubmitted && form.cortex_connections.length < 5 && (
            <button className="ghost" onClick={() => set('cortex_connections', [...form.cortex_connections, { ...EMPTY_CONNECTION }])}
              style={{ fontSize: '0.82rem', padding: '6px 12px', whiteSpace: 'nowrap' }}>
              + Add
            </button>
          )}
        </div>
        {form.cortex_connections.length === 0 && (
          <div className="empty">None — or click + Add to declare.</div>
        )}
        {form.cortex_connections.map((conn, i) => (
          <div key={i} className="ea-repeating-row">
            <div className="ea-grid-2">
              <div><label>Name</label>
                <input type="text" value={conn.name} disabled={isSubmitted}
                  onChange={(e) => setConnection(i, 'name', e.target.value)} /></div>
              <div><label>Relationship</label>
                <input type="text" value={conn.relationship} disabled={isSubmitted}
                  onChange={(e) => setConnection(i, 'relationship', e.target.value)} /></div>
            </div>
            <div className="ea-grid-2">
              <div><label>Department</label>
                <input type="text" value={conn.department} disabled={isSubmitted}
                  onChange={(e) => setConnection(i, 'department', e.target.value)} /></div>
              <div><label>Position</label>
                <input type="text" value={conn.position} disabled={isSubmitted}
                  onChange={(e) => setConnection(i, 'position', e.target.value)} /></div>
            </div>
            {!isSubmitted && (
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <button className="ghost" onClick={() => set('cortex_connections', form.cortex_connections.filter((_, j) => j !== i))}
                  style={{ fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Remove
                </button>
              </div>
            )}
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
          <button className="primary" onClick={() => router.push('/ea/employment')} disabled={saving}>← Back</button>
          <button className="primary" onClick={handleNext} disabled={saving}>
            Next: Referees →
          </button>
        </div>
      ) : (
        <div className="ea-form-actions">
          <button className="primary" onClick={() => router.push('/ea/referees')}>
            Next: Referees →
          </button>
        </div>
      )}
    </div>
  );
}
