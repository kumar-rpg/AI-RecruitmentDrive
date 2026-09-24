'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setApplicantPin, deleteApplicantApplication } from '@/lib/ea-actions';

export default function AdminClient({ applicants }) {
  const router = useRouter();

  const [states, setStates] = useState(() => {
    const s = {};
    applicants.forEach((a) => {
      s[a.id] = { loading: false, msg: '', pinInput: false, pin: '', confirmDelete: false };
    });
    return s;
  });

  function update(id, patch) {
    setStates((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  }

  async function handleSetPin(applicant) {
    const { pin } = states[applicant.id];
    if (!/^\d{6}$/.test(pin)) {
      update(applicant.id, { msg: 'Error: PIN must be exactly 6 digits.' });
      return;
    }
    update(applicant.id, { loading: true, msg: '' });
    const result = await setApplicantPin(applicant.authUserId, pin);
    update(applicant.id, {
      loading: false,
      msg: result.error ? `Error: ${result.error}` : 'PIN updated ✓',
      pinInput: false,
      pin: '',
    });
  }

  async function handleDelete(applicant) {
    update(applicant.id, { loading: true, msg: '' });
    const result = await deleteApplicantApplication(applicant.authUserId);
    if (result.error) {
      update(applicant.id, { loading: false, msg: `Error: ${result.error}`, confirmDelete: false });
    } else {
      router.refresh();
    }
  }

  if (applicants.length === 0) {
    return (
      <div className="card">
        <div className="empty">No applicants with &quot;Interview&quot; status.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--muted)' }}>
        {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} with Interview status
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Email</th>
              <th>Form Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((a) => {
              const { loading, msg, pinInput, pin, confirmDelete } = states[a.id] || {};
              return (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{a.position}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{a.email}</td>
                  <td>
                    {a.formStatus === 'submitted' ? (
                      <span className="pill ok">Submitted</span>
                    ) : a.formStatus === 'draft' ? (
                      <span className="pill na">In Progress</span>
                    ) : (
                      <span className="pill na">Not Started</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {a.formStatus === 'submitted' && a.authUserId && (
                      <a
                        href={`/api/ea/pdf/${a.authUserId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ghost"
                        style={{ display: 'inline-block', padding: '8px 14px', fontSize: '0.82rem', textDecoration: 'none', textAlign: 'center',
                          color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 8 }}
                        title="Download completed application as PDF"
                      >
                        Print PDF
                      </a>
                    )}
                    {pinInput ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="6-digit PIN"
                          value={pin}
                          onChange={(e) => update(a.id, { pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          style={{ width: 100, letterSpacing: '0.2em', fontSize: '0.9rem' }}
                          autoFocus
                        />
                        <button
                          className="primary"
                          disabled={loading}
                          onClick={() => handleSetPin(a)}
                          style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                        >
                          {loading ? '…' : 'Save'}
                        </button>
                        <button
                          className="ghost"
                          disabled={loading}
                          onClick={() => update(a.id, { pinInput: false, pin: '', msg: '' })}
                          style={{ padding: '4px 10px', fontSize: '0.82rem' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="ghost"
                        style={{ borderColor: 'var(--text)' }}
                        disabled={loading || !a.authUserId}
                        onClick={() => update(a.id, { pinInput: true, msg: '' })}
                        title={a.authUserId ? 'Set a new PIN for this applicant' : 'Applicant has not registered yet'}
                      >
                        Set PIN
                      </button>
                    )}
                    {msg && (
                      <div
                        style={{ fontSize: '0.78rem', marginTop: 4 }}
                        className={msg.startsWith('Error') ? 'err' : 'hint'}
                      >
                        {msg}
                      </div>
                    )}
                    {a.authUserId && (
                      confirmDelete ? (
                        <div style={{ marginTop: 4 }}>
                          <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginBottom: 4 }}>
                            Delete all data for {a.name}?
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="primary"
                              style={{ fontSize: '0.8rem', background: 'var(--danger)', borderColor: 'var(--danger)', padding: '4px 10px' }}
                              disabled={loading}
                              onClick={() => handleDelete(a)}
                            >
                              {loading ? 'Deleting…' : 'Confirm'}
                            </button>
                            <button
                              className="ghost"
                              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                              disabled={loading}
                              onClick={() => update(a.id, { confirmDelete: false, msg: '' })}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="ghost"
                          style={{ fontSize: '0.82rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          disabled={loading}
                          onClick={() => update(a.id, { confirmDelete: true, msg: '' })}
                        >
                          Delete Application
                        </button>
                      )
                    )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
