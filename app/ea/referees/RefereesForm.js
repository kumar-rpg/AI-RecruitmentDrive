'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormProgress from '@/components/ea/FormProgress';
import { saveDraft } from '@/lib/ea-actions';

const EMPTY_REFEREE = { name: '', relationship: '', phone: '', department: '', position: '', company: '' };
const EMPTY_EMERGENCY = { name: '', relationship: '', phone: '' };

export default function RefereesForm({ initialData }) {
  const router = useRouter();
  const isSubmitted = initialData?.status === 'submitted';

  const [ref1, setRef1] = useState(
    initialData?.referee_1 && Object.keys(initialData.referee_1).length
      ? initialData.referee_1 : { ...EMPTY_REFEREE }
  );
  const [ref2, setRef2] = useState(
    initialData?.referee_2 && Object.keys(initialData.referee_2).length
      ? initialData.referee_2 : { ...EMPTY_REFEREE }
  );
  const [contactPresent, setContactPresent] = useState(
    initialData?.contact_present_employer ?? null
  );
  const [contactPrevious, setContactPrevious] = useState(
    initialData?.contact_previous_employer ?? null
  );
  const [emergency, setEmergency] = useState(
    initialData?.emergency_contact && Object.keys(initialData.emergency_contact).length
      ? initialData.emergency_contact : { ...EMPTY_EMERGENCY }
  );

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  function RefereeFields({ data, onChange, disabled, title }) {
    const f = (field) => (e) => onChange({ ...data, [field]: e.target.value });
    return (
      <div className="ea-repeating-row">
        <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: 12 }}>{title}</strong>
        <div className="ea-grid-2">
          <div><label>Name</label>
            <input type="text" value={data.name} disabled={disabled} onChange={f('name')} /></div>
          <div><label>Relationship to You</label>
            <input type="text" value={data.relationship} disabled={disabled} onChange={f('relationship')} /></div>
        </div>
        <div className="ea-grid-2">
          <div><label>Phone</label>
            <input type="tel" value={data.phone} disabled={disabled} onChange={f('phone')} /></div>
          <div><label>Company / Organisation</label>
            <input type="text" value={data.company} disabled={disabled} onChange={f('company')} /></div>
        </div>
        <div className="ea-grid-2">
          <div><label>Department</label>
            <input type="text" value={data.department} disabled={disabled} onChange={f('department')} /></div>
          <div><label>Position / Title</label>
            <input type="text" value={data.position} disabled={disabled} onChange={f('position')} /></div>
        </div>
      </div>
    );
  }

  function YesNo({ label, value, onChange, disabled }) {
    return (
      <div style={{ marginBottom: 16 }}>
        <label>{label}</label>
        <div className="radio-row" style={{ marginTop: 8 }}>
          {[{ val: true, lbl: 'Yes' }, { val: false, lbl: 'No' }].map(({ val, lbl }) => (
            <label key={lbl} className={`option ${value === val ? 'picked' : ''}`}>
              <input type="radio" checked={value === val} disabled={disabled}
                onChange={() => onChange(val)} />
              {lbl}
            </label>
          ))}
        </div>
      </div>
    );
  }

  async function handleSaveDraft() {
    setSaving(true);
    setSaveMsg('');
    const result = await saveDraft({
      referee_1: ref1, referee_2: ref2,
      contact_present_employer: contactPresent,
      contact_previous_employer: contactPrevious,
      emergency_contact: emergency,
    });
    setSaving(false);
    setSaveMsg(result.error ? `Error: ${result.error}` : 'Draft saved.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  async function handleNext() {
    setSaving(true);
    await saveDraft({
      referee_1: ref1, referee_2: ref2,
      contact_present_employer: contactPresent,
      contact_previous_employer: contactPrevious,
      emergency_contact: emergency,
    });
    setSaving(false);
    router.push('/ea/declaration');
  }

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <header className="page-header">
        <div>
          <h1>Employment Application</h1>
          <div className="sub">CORTEX ROBOTICS</div>
        </div>
        <button className="ghost" onClick={() => router.push('/ea/general')}>â† Back</button>
      </header>

      <FormProgress step={5} submitted={isSubmitted} />

      {isSubmitted && (
        <div className="success-box" style={{ marginBottom: 16 }}>
          Your application has been submitted and is read-only.
        </div>
      )}

      {/* Character Referees */}
      <div className="card">
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>Character Referees</h2>
        <p className="hint" style={{ marginBottom: 18 }}>
          Please provide two referees who are not relatives. Do not include your current employer
          unless you consent to us contacting them.
        </p>
        <RefereeFields data={ref1} onChange={setRef1} disabled={isSubmitted} title="Referee 1" />
        <RefereeFields data={ref2} onChange={setRef2} disabled={isSubmitted} title="Referee 2" />

        <div style={{ marginTop: 20 }}>
          <YesNo
            label="May we contact your present employer for a reference?"
            value={contactPresent}
            onChange={setContactPresent}
            disabled={isSubmitted}
          />
          <YesNo
            label="May we contact your previous employer(s) for a reference?"
            value={contactPrevious}
            onChange={setContactPrevious}
            disabled={isSubmitted}
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="card">
        <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>Emergency Contact</h2>
        <div className="ea-grid-3">
          <div><label>Name</label>
            <input type="text" value={emergency.name} disabled={isSubmitted}
              onChange={(e) => setEmergency({ ...emergency, name: e.target.value })} /></div>
          <div><label>Relationship</label>
            <input type="text" value={emergency.relationship} disabled={isSubmitted}
              onChange={(e) => setEmergency({ ...emergency, relationship: e.target.value })} /></div>
          <div><label>Phone</label>
            <input type="tel" value={emergency.phone} disabled={isSubmitted}
              onChange={(e) => setEmergency({ ...emergency, phone: e.target.value })} /></div>
        </div>
      </div>

      {!isSubmitted ? (
        <div className="ea-form-actions">
          {saveMsg && <span className={saveMsg.startsWith('Error') ? 'err' : 'hint'}>{saveMsg}</span>}
          <button className="primary" onClick={handleSaveDraft} disabled={saving}>
            {saving ? 'Savingâ€¦' : 'Save Draft'}
          </button>
          <button className="primary" onClick={handleNext} disabled={saving}>
            Next: Declaration â†’
          </button>
        </div>
      ) : (
        <div className="ea-form-actions">
          <button className="primary" onClick={() => router.push('/ea/declaration')}>
            Next: Declaration â†’
          </button>
        </div>
      )}
    </div>
  );
}
