'use client';

import { useState } from 'react';
import { sendInvite, resetApplicantPassword } from '@/lib/ea-actions';

export default function AdminClient({ applicants }) {
  const [states, setStates] = useState(() => {
    const s = {};
    applicants.forEach((a) => { s[a.id] = { loading: false, msg: '' }; });
    return s;
  });

  function setMsg(id, msg) {
    setStates((s) => ({ ...s, [id]: { ...s[id], msg, loading: false } }));
  }

  function setLoading(id, loading) {
    setStates((s) => ({ ...s, [id]: { ...s[id], loading, msg: '' } }));
  }

  async function handleSendInvite(applicant) {
    setLoading(applicant.id, true);
    const result = await sendInvite(applicant.email);
    setMsg(applicant.id, result.error ? `Error: ${result.error}` : 'Invite sent ✓');
  }

  async function handleResetPassword(applicant) {
    setLoading(applicant.id, true);
    const result = await resetApplicantPassword(applicant.email);
    setMsg(applicant.id, result.error ? `Error: ${result.error}` : 'Reset email sent ✓');
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
              const { loading, msg } = states[a.id] || {};
              const formStatus = a.formStatus;
              return (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{a.position}</td>
                  <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{a.email}</td>
                  <td>
                    {formStatus === 'submitted' ? (
                      <span className="pill ok">Submitted</span>
                    ) : formStatus === 'draft' ? (
                      <span className="pill na">In Progress</span>
                    ) : (
                      <span className="pill na">Not Started</span>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="ghost"
                        disabled={loading}
                        onClick={() => handleSendInvite(a)}
                        title="Send invite email to set password"
                      >
                        {loading ? '…' : 'Send Invite'}
                      </button>
                      <button
                        className="ghost"
                        disabled={loading}
                        onClick={() => handleResetPassword(a)}
                        title="Send password reset email"
                      >
                        {loading ? '…' : 'Reset Password'}
                      </button>
                    </div>
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
