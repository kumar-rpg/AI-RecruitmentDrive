'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormProgress from '@/components/ea/FormProgress';
import { saveDraft } from '@/lib/ea-actions';

const EDU_TYPES = ['Primary', 'Secondary', 'University / College', 'Others'];

const DEFAULT_EDU = EDU_TYPES.map((type) => ({
  type, school: '', qualification: '', year: '',
}));

const DEFAULT_LANG = {
  english: { speaking: '', reading: '', writing: '' },
  bahasa_malaysia: { speaking: '', reading: '', writing: '' },
  chinese: { speaking: '', reading: '', writing: '' },
  others: { name: '', speaking: '', reading: '', writing: '' },
};

const EMPTY_TRAINING = { course: '', institution: '', qualification: '', year: '' };

export default function EducationForm({ initialData }) {
  const router = useRouter();
  const isSubmitted = initialData?.status === 'submitted';

  const [education, setEducation] = useState(
    initialData?.education?.length ? initialData.education : DEFAULT_EDU
  );
  const [training, setTraining] = useState(
    initialData?.professional_training?.length
      ? initialData.professional_training
      : [{ ...EMPTY_TRAINING }]
  );
  const [languages, setLanguages] = useState(
    initialData?.languages && Object.keys(initialData.languages).length
      ? initialData.languages
      : DEFAULT_LANG
  );

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  function setEdu(idx, field, value) {
    setEducation((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function setTrainingRow(idx, field, value) {
    setTraining((rows) => rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function setLang(lang, skill, value) {
    setLanguages((l) => ({ ...l, [lang]: { ...l[lang], [skill]: value } }));
  }

  async function handleSaveDraft() {
    setSaving(true);
    setSaveMsg('');
    const result = await saveDraft({ education, professional_training: training, languages });
    setSaving(false);
    setSaveMsg(result.error ? `Error: ${result.error}` : 'Draft saved.');
    setTimeout(() => setSaveMsg(''), 3000);
  }

  async function handleNext() {
    setSaving(true);
    await saveDraft({ education, professional_training: training, languages });
    setSaving(false);
    router.push('/ea/employment');
  }

  const langKeys = [
    { key: 'english', label: 'English' },
    { key: 'bahasa_malaysia', label: 'Bahasa Malaysia' },
    { key: 'chinese', label: 'Chinese' },
    { key: 'others', label: null },
  ];

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <header className="page-header">
        <div>
          <h1>Employment Application</h1>
          <div className="sub">CORTEX ROBOTICS</div>
        </div>
        <button className="ghost" onClick={() => router.push('/ea/personal')}>â† Back</button>
      </header>

      <FormProgress step={2} submitted={isSubmitted} />

      {isSubmitted && (
        <div className="success-box" style={{ marginBottom: 16 }}>
          Your application has been submitted and is read-only.
        </div>
      )}

      {/* Education Level */}
      <div className="card">
        <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>Education Level</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Level</th>
                <th>Name of School / University</th>
                <th>Qualification</th>
                <th style={{ width: 80 }}>Year</th>
              </tr>
            </thead>
            <tbody>
              {education.map((row, i) => (
                <tr key={row.type}>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{row.type}</td>
                  <td>
                    <input type="text" value={row.school} disabled={isSubmitted}
                      onChange={(e) => setEdu(i, 'school', e.target.value)} style={{ width: '100%' }} />
                  </td>
                  <td>
                    <input type="text" value={row.qualification} disabled={isSubmitted}
                      onChange={(e) => setEdu(i, 'qualification', e.target.value)} style={{ width: '100%' }} />
                  </td>
                  <td>
                    <input type="text" value={row.year} disabled={isSubmitted}
                      onChange={(e) => setEdu(i, 'year', e.target.value)}
                      maxLength={4} placeholder="YYYY" style={{ width: '100%' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Professional Training */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Professional Training</h2>
          {!isSubmitted && training.length < 5 && (
            <button className="ghost" onClick={() => setTraining((r) => [...r, { ...EMPTY_TRAINING }])}
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
              + Add Row
            </button>
          )}
        </div>
        {training.length === 0 && <div className="empty">No training entries. Click + Add Row.</div>}
        {training.map((row, i) => (
          <div key={i} className="ea-repeating-row">
            <div className="ea-grid-2">
              <div>
                <label>Course / Programme</label>
                <input type="text" value={row.course} disabled={isSubmitted}
                  onChange={(e) => setTrainingRow(i, 'course', e.target.value)} />
              </div>
              <div>
                <label>Institution</label>
                <input type="text" value={row.institution} disabled={isSubmitted}
                  onChange={(e) => setTrainingRow(i, 'institution', e.target.value)} />
              </div>
            </div>
            <div className="ea-grid-2">
              <div>
                <label>Qualification / Certificate</label>
                <input type="text" value={row.qualification} disabled={isSubmitted}
                  onChange={(e) => setTrainingRow(i, 'qualification', e.target.value)} />
              </div>
              <div>
                <label>Year</label>
                <input type="text" value={row.year} disabled={isSubmitted}
                  onChange={(e) => setTrainingRow(i, 'year', e.target.value)}
                  maxLength={4} placeholder="YYYY" />
              </div>
            </div>
            {!isSubmitted && (
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <button className="ghost" onClick={() => setTraining((r) => r.filter((_, j) => j !== i))}
                  style={{ fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  Remove
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Languages & Dialects */}
      <div className="card">
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>Languages & Dialects</h2>
        <p className="hint" style={{ marginBottom: 16 }}>Rate proficiency 0 (none) â€“ 10 (native).</p>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 160 }}>Language</th>
                <th>Speaking</th>
                <th>Reading</th>
                <th>Writing</th>
              </tr>
            </thead>
            <tbody>
              {langKeys.map(({ key, label }) => (
                <tr key={key}>
                  <td>
                    {key === 'others' ? (
                      <input type="text" value={languages.others?.name || ''} disabled={isSubmitted}
                        onChange={(e) => setLang('others', 'name', e.target.value)}
                        placeholder="Other languageâ€¦" style={{ width: '100%' }} />
                    ) : (
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</span>
                    )}
                  </td>
                  {['speaking', 'reading', 'writing'].map((skill) => (
                    <td key={skill}>
                      <input type="number" min={0} max={10}
                        value={languages[key]?.[skill] ?? ''}
                        disabled={isSubmitted}
                        onChange={(e) => setLang(key, skill, e.target.value)}
                        style={{ width: 64 }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isSubmitted ? (
        <div className="ea-form-actions">
          {saveMsg && <span className={saveMsg.startsWith('Error') ? 'err' : 'hint'}>{saveMsg}</span>}
          <button className="primary" onClick={handleSaveDraft} disabled={saving}>
            {saving ? 'Savingâ€¦' : 'Save Draft'}
          </button>
          <button className="primary" onClick={handleNext} disabled={saving}>
            Next: Employment â†’
          </button>
        </div>
      ) : (
        <div className="ea-form-actions">
          <button className="primary" onClick={() => router.push('/ea/employment')}>
            Next: Employment â†’
          </button>
        </div>
      )}
    </div>
  );
}
