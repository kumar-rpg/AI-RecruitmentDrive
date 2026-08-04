'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { getUploadTargets, submitApplication } from './actions';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  category: '',
  org: '',
  program: '',
  position: '',
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const PHONE_PATTERN = /^\d{3}-\d{4,8}$/;

function sanitizeName(raw) {
  // Letters and single spaces between words only — strips digits, symbols,
  // and collapses repeated spaces as the user types.
  return raw.replace(/[^A-Za-z\s]/g, '').replace(/\s{2,}/g, ' ');
}

function formatPhone(raw) {
  // Digits only, hyphen auto-inserted after the first 3 (e.g. 016-4028507).
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

export default function ApplyForm({ positions }) {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [resumeFile, setResumeFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isWorking = form.category === 'working';

  function isPDF(file) {
    if (!file) return false;
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  function handleFileSelect(e, setFile, label) {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setFile(null);
      return;
    }
    if (files.length > 1) {
      setError(`Please select only 1 file for ${label} — you selected ${files.length}.`);
      e.target.value = '';
      setFile(null);
      return;
    }
    setError('');
    setFile(files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Full Name cannot be blank.');
      return;
    }
    if (!NAME_PATTERN.test(form.name.trim())) {
      setError('Full Name must contain letters only (no numbers or symbols).');
      return;
    }
    if (!form.email.trim()) {
      setError('Email Address cannot be blank.');
      return;
    }
    if (!EMAIL_PATTERN.test(form.email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!form.phone.trim()) {
      setError('Mobile No. cannot be blank.');
      return;
    }
    if (!PHONE_PATTERN.test(form.phone.trim())) {
      setError('Mobile No. must be in the format 016-4028507 (3 digits, hyphen, then the rest).');
      return;
    }
    if (!form.position) {
      setError('Please select a Position Applied For.');
      return;
    }
    if (!form.category) {
      setError('Please select one: Intern, Graduating / Job-seeking, or Already Working.');
      return;
    }
    if (!isWorking) {
      if (!form.org.trim()) {
        setError('University cannot be blank.');
        return;
      }
      if (!form.program.trim()) {
        setError('Program cannot be blank.');
        return;
      }
    }
    if (!resumeFile) {
      setError('Resume is required.');
      return;
    }
    if (!isPDF(resumeFile)) {
      setError('Resume must be a PDF file.');
      return;
    }
    if (!isWorking) {
      if (!transcriptFile) {
        setError('Academic Transcript is required for Intern / Graduating / Job-seeking applicants.');
        return;
      }
      if (!isPDF(transcriptFile)) {
        setError('Transcript must be a PDF file.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const targets = await getUploadTargets(form.category);
      const supabase = supabaseBrowser();

      const { error: resumeUploadError } = await supabase.storage
        .from('applications')
        .uploadToSignedUrl(targets.resume.path, targets.resume.token, resumeFile);
      if (resumeUploadError) throw new Error('Resume upload failed: ' + resumeUploadError.message);

      let transcriptPath = null;
      if (!isWorking) {
        const { error: transcriptUploadError } = await supabase.storage
          .from('applications')
          .uploadToSignedUrl(targets.transcript.path, targets.transcript.token, transcriptFile);
        if (transcriptUploadError)
          throw new Error('Transcript upload failed: ' + transcriptUploadError.message);
        transcriptPath = targets.transcript.path;
      }

      await submitApplication({
        id: targets.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        position: form.position,
        category: form.category,
        org: isWorking ? '' : form.org,
        program: isWorking ? '' : form.program,
        resumePath: targets.resume.path,
        transcriptPath,
      });

      router.push('/thank-you');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>CORTEX ROBOTICS</h1>
          <div className="sub">Internship / Recruitment Drive</div>
        </div>
        <ThemeToggle />
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <label>Full Name</label>
        <input
          type="text"
          placeholder="e.g. Jane Tan"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: sanitizeName(e.target.value) })}
          required
        />

        <label>Email Address</label>
        <input
          type="email"
          placeholder="e.g. jane.tan@email.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label>Mobile No.</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="e.g. 016-4028507"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
          required
        />

        <label>Position Applied For</label>
        {positions.length === 0 ? (
          <div className="hint">
            No positions are currently open — check back later, or contact us directly.
          </div>
        ) : (
          <select
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            required
          >
            <option value="" disabled>
              Select a position…
            </option>
            {positions.map((p) => (
              <option key={p.id} value={p.title}>
                {p.title}
              </option>
            ))}
          </select>
        )}

        <label>Are you currently studying, or already working?</label>
        <div className="radio-row">
          {[
            { val: 'intern', label: 'Studying — Intern' },
            { val: 'grad', label: 'Studying — Graduating / Job-seeking' },
            { val: 'working', label: 'Already Working' },
          ].map((opt) => (
            <label
              key={opt.val}
              className={'option' + (form.category === opt.val ? ' picked' : '')}
            >
              <input
                type="radio"
                name="category"
                value={opt.val}
                checked={form.category === opt.val}
                onChange={() =>
                  setForm({
                    ...form,
                    category: opt.val,
                    org: opt.val === 'working' ? '' : form.org,
                    program: opt.val === 'working' ? '' : form.program,
                  })
                }
                required
              />{' '}
              {opt.label}
            </label>
          ))}
        </div>

        {!isWorking && (
          <>
            <label>University</label>
            <input
              type="text"
              placeholder="e.g. TARUMT"
              value={form.org}
              onChange={(e) => setForm({ ...form, org: e.target.value })}
              required
            />

            <label>Program</label>
            <input
              type="text"
              placeholder="e.g. B.Sc Computer Science / Software Engineer"
              value={form.program}
              onChange={(e) => setForm({ ...form, program: e.target.value })}
              required
            />
          </>
        )}

        <label>Resume (PDF only — 1 file)</label>
        <div className="file-row">
          <input
            type="file"
            accept="application/pdf"
            multiple={false}
            onChange={(e) => handleFileSelect(e, setResumeFile, 'Resume')}
          />
          <div className="hint">{resumeFile ? resumeFile.name : 'No file chosen'}</div>
        </div>

        {!isWorking && (
          <>
            <label>Academic Transcript — from start of program (PDF only — 1 file)</label>
            <div className="file-row">
              <input
                type="file"
                accept="application/pdf"
                multiple={false}
                onChange={(e) => handleFileSelect(e, setTranscriptFile, 'Academic Transcript')}
              />
              <div className="hint">{transcriptFile ? transcriptFile.name : 'No file chosen'}</div>
            </div>
          </>
        )}

        {error && <div className="err">{error}</div>}

        <button className="primary" type="submit" disabled={submitting || positions.length === 0}>
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
