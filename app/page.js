'use client';

import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { getUploadTargets, submitApplication } from './actions';

const initialForm = { name: '', category: '', org: '', program: '' };

export default function ApplyPage() {
  const [form, setForm] = useState(initialForm);
  const [resumeFile, setResumeFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const isWorking = form.category === 'working';
  const orgLabel = isWorking ? 'Current Employer' : 'University';
  const progLabel = isWorking ? 'Current Role' : 'Program';

  function isPDF(file) {
    if (!file) return false;
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.category || !form.org.trim() || !form.program.trim()) {
      setError('Please fill in all fields and pick a category.');
      return;
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
        setError('Transcript is required for this category.');
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
        category: form.category,
        org: form.org,
        program: form.program,
        resumePath: targets.resume.path,
        transcriptPath,
      });

      setSuccess(true);
      setForm(initialForm);
      setResumeFile(null);
      setTranscriptFile(null);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
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
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

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
                onChange={() => setForm({ ...form, category: opt.val })}
              />{' '}
              {opt.label}
            </label>
          ))}
        </div>

        <label>{orgLabel}</label>
        <input
          type="text"
          placeholder="e.g. TARUMT"
          value={form.org}
          onChange={(e) => setForm({ ...form, org: e.target.value })}
        />

        <label>{progLabel}</label>
        <input
          type="text"
          placeholder="e.g. B.Sc Computer Science / Software Engineer"
          value={form.program}
          onChange={(e) => setForm({ ...form, program: e.target.value })}
        />

        <label>Resume (PDF only)</label>
        <div className="file-row">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
          />
        </div>

        {!isWorking && (
          <>
            <label>Academic Transcript — from start of program (PDF only)</label>
            <div className="file-row">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setTranscriptFile(e.target.files?.[0] || null)}
              />
            </div>
          </>
        )}

        {error && <div className="err">{error}</div>}

        <button className="primary" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Application'}
        </button>

        {success && (
          <div className="success-box">✅ Submitted — thanks, we will be in touch.</div>
        )}
      </form>
    </div>
  );
}
