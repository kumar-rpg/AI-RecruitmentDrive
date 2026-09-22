'use client';

import { useState } from 'react';
import { setApplicantPin } from '@/lib/ea-actions';

export default function AdminClient({ applicants }) {
  const [states, setStates] = useState(() => {
    const s = {};
    applicants.forEach((a) => { s[a.id] = { loading: false, msg: '', pinInput: false, pin: '' }; });
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
              const { loading, msg, pinInput, pin } = states[a.id] || {};
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
