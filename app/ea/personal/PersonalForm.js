'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormProgress from '@/components/ea/FormProgress';
import { saveDraft, signOutApplicant } from '@/lib/ea-actions';
import { supabaseBrowser } from '@/lib/supabaseClient';

const STATES = [
  'Penang','Perak','Johor','Kedah','Kelantan','Malacca','Negeri Sembilan',
  'Pahang','Kuala Lumpur','Perlis','Selangor','Terengganu','Sabah','Sarawak',
];

const RELIGIONS = [
  'Buddhism','Catholicism','Christianity','Hinduism','Islam',
  'Judaism','Sikhism','Taoism','Agnostic','Atheist','Other',
];

const RACES = [
  'Australian','Bajau','Bajau Iranun','Bangladeshi','Banjar','Bidayuh','Bisaya',
  'Boyanese','Brazilian','Brunei','Bugis','Burmese','Cambodian','Caucasian',
  'Chinese','Chinese Han','Dayak','Dusun','Dusun Sino','English','Eurasian',
  'Filipino','Iban','Idaan','India Dusun','Indian','Iranun','Japanese','Javanese',
  'Kadazan','Kadazan Dusun','Kagayan','Kimaragang','Kinh','Korean','Lun Bawang',
  'Lundayeh','Malay','Manchu','Melanau','Mongols','Murut','Orang Asli','Orang Ulu',
  'Others','Pakistani','Punjabi','Rungus','Siamese','Singh','Sino','Sino Kadazan',
  'Sri Lankan','Suluk','Sungai','Tator','Temiar-Temer','Thai','Tidung','Timur',
  'Tombonuo','Visaya','White',
];

const LICENSE_OPTIONS = [
  { value: 'A', label: 'A — Motorcycle' },
  { value: 'B2', label: 'B2 — Motorcycle' },
  { value: 'B', label: 'B — Motorcycle' },
  { value: 'C', label: 'C — Motorcycle' },
  { value: 'D', label: 'D — Car' },
  { value: 'DA', label: 'DA — Car' },
];

const REQUIRED_FIELDS = [
  'full_name','ic_or_passport','gender','age','nationality','race','religion',
  'date_of_birth','phone_mobile','email','residential_address','country','marital_status',
];

function empty(val) {
  return val === null || val === undefined || val === '';
}

export default function PersonalForm({ initialData }) {
  const router = useRouter();
  const isSubmitted = initialData?.status === 'submitted';

  const [form, setForm] = useState({
    full_name: initialData?.full_name || '',
    ic_or_passport: initialData?.ic_or_passport || '',
    gender: initialData?.gender || '',
    age: initialData?.age || '',
    nationality: initialData?.nationality || '',
    race: initialData?.race || '',
    religion: initialData?.religion || '',
    date_of_birth: initialData?.date_of_birth || '',
    phone_home: initialData?.phone_home || '',
    phone_mobile: initialData?.phone_mobile || '',
    email: initialData?.email || '',
    residential_address: initialData?.residential_address || '',
    country: initialData?.country || 'Malaysia',
    country_other: initialData?.country_other || '',
    state: initialData?.state || '',
    marital_status: initialData?.marital_status || '',
    driving_license: initialData?.driving_license || [],
    photo_path: initialData?.photo_path || '',
    position_applied: initialData?.position_applied || '',
  });

  const [nationalityChoice, setNationalityChoice] = useState(
    !initialData?.nationality ? '' : initialData.nationality === 'Malaysian' ? 'Malaysian' : 'Other'
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  function handleIcChange(ic) {
    const updates = { ic_or_passport: ic };
    const digits = ic.replace(/\D/g, '');
    if (digits.length >= 6) {
      const yy = parseInt(digits.slice(0, 2), 10);
      const mm = digits.slice(2, 4);
      const dd = digits.slice(4, 6);
      const currentYY = new Date().getFullYear() % 100;
      const fullYear = yy <= currentYY ? 2000 + yy : 1900 + yy;
      const age = new Date().getFullYear() - fullYear;
      updates.age = age;
      updates.date_of_birth = `${fullYear}-${mm}-${dd}`;
    }
    setForm((f) => ({ ...f, ...updates }));
    if (errors.ic_or_passport) setErrors((e) => ({ ...e, ic_or_passport: '' }));
    if (updates.age && errors.age) setErrors((e) => ({ ...e, age: '' }));
    if (updates.date_of_birth && errors.date_of_birth) setErrors((e) => ({ ...e, date_of_birth: '' }));
  }

  function toggleLicense(val) {
    set('driving_license',
      form.driving_license.includes(val)
        ? form.driving_license.filter((v) => v !== val)
        : [...form.driving_license, val]
    );
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = supabaseBrowser();
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/photo.jpg`;
    const { error } = await supabase.storage
      .from('applications')
      .upload(path, file, { upsert: true });
    setUploading(false);
    if (!error) set('photo_path', path);
  }

  function validate() {
    const errs = {};
    REQUIRED_FIELDS.forEach((f) => {
      if (empty(form[f])) errs[f] = 'This field is required';
    });
    if (form.country === 'Other' && empty(form.country_other)) {
      errs.country_other = 'Please specify your country';
    }
    if (form.country === 'Malaysia' && empty(form.state)) {
      errs.state = 'This field is required';
    }
    return errs;
  }

  async function handleSaveDraft() {
    setSaving(true);
    setSaveMsg('');
    const result = await saveDraft(form);
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
    await saveDraft(form);
    setSaving(false);
    router.push('/ea/education');
  }

  return (
    <div className="wrap" style={{ maxWidth: 720 }}>
      <header className="page-header">
        <div>
          <h1>Employment Application</h1>
          <div className="sub">
            CORTEX ROBOTICS
            {form.position_applied && ` — ${form.position_applied}`}
          </div>
        </div>
        <button className="ghost" disabled={saving} style={{ whiteSpace: 'nowrap' }}
          onClick={async () => {
            if (!isSubmitted) { setSaving(true); await saveDraft(form); }
            await signOutApplicant();
          }}>
          {saving ? 'Saving…' : 'Sign Out'}
        </button>
      </header>

      <FormProgress step={1} submitted={isSubmitted} />

      {isSubmitted && (
        <div className="success-box" style={{ marginBottom: 16 }}>
          Your application has been submitted and is read-only.
        </div>
      )}

      <div className="card">
        <h2 style={{ margin: '0 0 18px', fontSize: '1.1rem' }}>Personal Information</h2>
        <p className="hint" style={{ marginTop: -10, marginBottom: 16 }}>All fields are required.</p>

        <div style={{ marginBottom: 18 }}>
          <label>Position Applied For</label>
          <input type="text" value={form.position_applied || '—'} readOnly
            style={{ background: 'var(--surface-2, #f5f5f5)', cursor: 'default', fontWeight: 600,
              color: 'var(--fg, #111)', opacity: 1 }} />
        </div>

        <div className="ea-grid-2">
          <div>
            <label>Full Name <span className="ea-req">*</span></label>
            <input type="text" value={form.full_name} disabled={isSubmitted}
              onChange={(e) => set('full_name', e.target.value)} placeholder="As per IC / Passport" />
            {errors.full_name && <div className="err">{errors.full_name}</div>}
          </div>
          <div>
            <label>IC / Passport No <span className="ea-req">*</span></label>
            <input type="text" value={form.ic_or_passport} disabled={isSubmitted}
              onChange={(e) => handleIcChange(e.target.value)} />
            {errors.ic_or_passport && <div className="err">{errors.ic_or_passport}</div>}
          </div>
        </div>

        <div className="ea-grid-3">
          <div>
            <label>Gender <span className="ea-req">*</span></label>
            <select value={form.gender} disabled={isSubmitted} onChange={(e) => set('gender', e.target.value)}>
              <option value="">Select…</option>
              <option>Male</option>
              <option>Female</option>
              <option>Others</option>
            </select>
            {errors.gender && <div className="err">{errors.gender}</div>}
          </div>
          <div>
            <label>Age <span className="ea-req">*</span></label>
            <input type="number" value={form.age} disabled={isSubmitted} min={16} max={99}
              onChange={(e) => set('age', e.target.value)} />
            {errors.age && <div className="err">{errors.age}</div>}
          </div>
          <div>
            <label>Date of Birth <span className="ea-req">*</span></label>
            <input type="date" value={form.date_of_birth} disabled={isSubmitted}
              onChange={(e) => set('date_of_birth', e.target.value)} />
            {errors.date_of_birth && <div className="err">{errors.date_of_birth}</div>}
          </div>
        </div>

        <div className="ea-grid-2">
          <div>
            <label>Nationality <span className="ea-req">*</span></label>
            <select value={nationalityChoice} disabled={isSubmitted}
              onChange={(e) => {
                const choice = e.target.value;
                setNationalityChoice(choice);
                set('nationality', choice === 'Malaysian' ? 'Malaysian' : '');
              }}>
              <option value="">Select…</option>
              <option value="Malaysian">Malaysian</option>
              <option value="Other">Other</option>
            </select>
            {nationalityChoice === 'Other' && (
              <input type="text" value={form.nationality} disabled={isSubmitted}
                onChange={(e) => set('nationality', e.target.value)}
                placeholder="Enter nationality" style={{ marginTop: 8 }} />
            )}
            {errors.nationality && <div className="err">{errors.nationality}</div>}
          </div>
          <div>
            <label>Race <span className="ea-req">*</span></label>
            <input list="race-list" value={form.race} disabled={isSubmitted}
              onChange={(e) => set('race', e.target.value)} placeholder="Type to search…" />
            <datalist id="race-list">
              {RACES.map((r) => <option key={r} value={r} />)}
            </datalist>
            {errors.race && <div className="err">{errors.race}</div>}
          </div>
        </div>

        <div>
          <label>Religion <span className="ea-req">*</span></label>
          <select value={form.religion} disabled={isSubmitted} onChange={(e) => set('religion', e.target.value)}>
            <option value="">Select…</option>
            {RELIGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          {errors.religion && <div className="err">{errors.religion}</div>}
        </div>

        <div className="ea-grid-2">
          <div>
            <label>Phone (Home)</label>
            <input type="tel" value={form.phone_home} disabled={isSubmitted}
              onChange={(e) => set('phone_home', e.target.value)} />
          </div>
          <div>
            <label>Phone (Mobile) <span className="ea-req">*</span></label>
            <input type="tel" value={form.phone_mobile} disabled={isSubmitted}
              onChange={(e) => set('phone_mobile', e.target.value)} />
            {errors.phone_mobile && <div className="err">{errors.phone_mobile}</div>}
          </div>
        </div>

        <div>
          <label>Email Address <span className="ea-req">*</span></label>
          <input type="email" value={form.email} disabled={isSubmitted}
            onChange={(e) => set('email', e.target.value)} />
          {errors.email && <div className="err">{errors.email}</div>}
        </div>

        <div>
          <label>Residential Address <span className="ea-req">*</span></label>
          <input type="text" value={form.residential_address} disabled={isSubmitted}
            onChange={(e) => set('residential_address', e.target.value)} />
          {errors.residential_address && <div className="err">{errors.residential_address}</div>}
        </div>

        <div className="ea-grid-2">
          <div>
            <label>Country <span className="ea-req">*</span></label>
            <select value={form.country} disabled={isSubmitted} onChange={(e) => set('country', e.target.value)}>
              <option value="">Select…</option>
              <option value="Malaysia">Malaysia</option>
              <option value="Other">Other</option>
            </select>
            {errors.country && <div className="err">{errors.country}</div>}
          </div>
          {form.country === 'Malaysia' ? (
            <div>
              <label>State <span className="ea-req">*</span></label>
              <select value={form.state} disabled={isSubmitted} onChange={(e) => set('state', e.target.value)}>
                <option value="">Select…</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.state && <div className="err">{errors.state}</div>}
            </div>
          ) : form.country === 'Other' ? (
            <div>
              <label>Country Name <span className="ea-req">*</span></label>
              <input type="text" value={form.country_other} disabled={isSubmitted}
                onChange={(e) => set('country_other', e.target.value)} placeholder="Enter country" />
              {errors.country_other && <div className="err">{errors.country_other}</div>}
            </div>
          ) : null}
        </div>

        <div>
          <label>Marital Status <span className="ea-req">*</span></label>
          <select value={form.marital_status} disabled={isSubmitted} onChange={(e) => set('marital_status', e.target.value)}>
            <option value="">Select…</option>
            <option>Single</option>
            <option>Married</option>
            <option>Divorced</option>
            <option>Widowed</option>
            <option>Separated</option>
          </select>
          {errors.marital_status && <div className="err">{errors.marital_status}</div>}
        </div>

        <div>
          <label>Driving License</label>
          <div className="ea-checkbox-group">
            {LICENSE_OPTIONS.map(({ value, label }) => (
              <label key={value} className={`ea-checkbox-item ${form.driving_license.includes(value) ? 'checked' : ''}`}>
                <input type="checkbox" checked={form.driving_license.includes(value)} disabled={isSubmitted}
                  onChange={() => toggleLicense(value)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label>Passport Size Photo / Selfie ( Format : JPG, PNG )</label>
          {form.photo_path && (
            <div className="hint" style={{ marginBottom: 6 }}>
              ✓ Photo uploaded: {form.photo_path.split('/').pop()}
            </div>
          )}
          {!isSubmitted && (
            <div className="file-row">
              <input type="file" accept="image/jpeg,image/png" onChange={handlePhotoUpload} disabled={uploading} />
              {uploading && <div className="hint">Uploading…</div>}
            </div>
          )}
        </div>
      </div>

      {!isSubmitted && (
        <div className="ea-form-actions">
          {saveMsg && <span className={saveMsg.startsWith('Error') ? 'err' : 'hint'}>{saveMsg}</span>}
          <button className="primary" onClick={handleSaveDraft} disabled={saving}
            style={{ background: '#FACC15', color: '#000', borderColor: '#FACC15' }}>
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button className="primary" onClick={handleNext} disabled={saving}>
            Next: Education →
          </button>
        </div>
      )}
      {isSubmitted && (
        <div className="ea-form-actions">
          <button className="primary" onClick={() => router.push('/ea/education')}>
            Next: Education →
          </button>
        </div>
      )}
    </div>
  );
}
