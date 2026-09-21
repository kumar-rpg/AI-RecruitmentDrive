'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormProgress from '@/components/ea/FormProgress';
import { saveDraft, submitApplication } from '@/lib/ea-actions';

const DECLARATION_TEXT = `I hereby declare that the information given above is true and correct to the best of my knowledge and I have not wilfully suppressed any material fact. I understand that any false statements or concealment of any fact may result in the termination of my employment.

I agree that CORTEX ROBOTICS SDN BHD may contact any of the references or previous employers I have given and may verify any information I have provided. I also agree that the Company may use the information supplied in this form for its employment records.

I authorise the Company to make any inquiries relating to my employment history and to obtain any documents relating to my professional qualifications and background.`;

export default function DeclarationForm({ initialData }) {
  const router = useRouter();
  const isSubmitted = initialData?.status === 'submitted';

  const today = new Date().toISOString().split('T')[0];

  const [declarationName, setDeclarationName] = useState(initialData?.declaration_name || '');
  const [declarationDate, setDeclarationDate] = useState(initialData?.declaration_date || today);
  const [agreed, setAgreed] = useState(isSubmitted);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  async function handleSaveDraft() {
    setSaving(true);
    setSaveMsg('');
    const result = await saveDraft({ declaration_name: declarationName, declaration_date: declarationDate });
    setSaving(false);
    setSaveMsg(result.error ? `Error: ${result.error}` : 'Draft saved.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  async function handleSubmit() {
    setError('');
    if (!declarationName.trim()) {
      setError('Please enter your full name to sign the declaration.');
      return;
    }
    if (!agreed) {
      setError('Please tick the box to confirm you have read and agree to the declaration.');
      return;
    }

    setSubmitting(true);
    await saveDraft({ declaration_name: declarationName, declaration_date: declarationDate });
    const result = await submitApplication();
    setSubmitting(false);

    if (result?.error) {
      setError(result.error);
    }
    // submitApplication redirects to /ea/success on success
  }

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <header className="page-header">
        <div>
          <h1>Employment Application</h1>
          <div className="sub">CORTEX ROBOTICS</div>
        </div>
        <button className="ghost" onClick={() => router.push('/ea/referees')}>← Back</button>
      </header>

      <FormProgress step={6} submitted={isSubmitted} />

      {isSubmitted && (
        <div className="success-box" style={{ marginBottom: 16 }}>
          Your application has been submitted. Thank you!
        </div>
      )}

      <div className="card">
        <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>Declaration</h2>

        <div style={{
          background: 'var(--input-bg)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '16px', marginBottom: 24,
          fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text)',
          whiteSpace: 'pre-line',
        }}>
          {DECLARATION_TEXT}
        </div>

        {!isSubmitted && (
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 3, flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem' }}>
              I have read, understood, and agree to the declaration above.
            </span>
          </label>
        )}

        <div className="ea-grid-2">
          <div>
            <label>Full Name (Signature) {!isSubmitted && <span className="ea-req">*</span>}</label>
            <input type="text" value={declarationName} disabled={isSubmitted}
              onChange={(e) => setDeclarationName(e.target.value)}
              placeholder="Type your full name" />
          </div>
          <div>
            <label>Date</label>
            <input type="date" value={declarationDate} disabled={isSubmitted}
              onChange={(e) => setDeclarationDate(e.target.value)} />
          </div>
        </div>

        {error && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
      </div>

      {!isSubmitted && (
        <div className="ea-form-actions">
          {saveMsg && <span className={saveMsg.startsWith('Error') ? 'err' : 'hint'}>{saveMsg}</span>}
          <button className="primary" onClick={handleSaveDraft} disabled={saving || submitting}>
            {saving ? 'Savingâ€¦' : 'Save Draft'}
          </button>
          <button
            className="primary"
            onClick={handleSubmit}
            disabled={submitting || saving}
            style={{ background: 'var(--accent2)', color: '#0d0f13' }}
          >
            {submitting ? 'Submittingâ€¦' : 'Submit Application'}
          </button>
        </div>
      )}
      {isSubmitted && (
        <div className="ea-form-actions">
          <button className="primary" onClick={() => router.push('/ea/success')}>
            View Confirmation →
          </button>
        </div>
      )}
    </div>
  );
}
