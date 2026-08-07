'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import StatsPanel from './StatsPanel';
import PositionsPanel from './PositionsPanel';
import { updateStatus, deleteApplicant, getDocUrl, signOut } from './actions';

const CATEGORY_LABEL = { intern: 'Intern', grad: 'Grad / Job-seeking', working: 'Already Working' };
const STATUSES = ['New', 'Reviewing', 'Shortlisted', 'Rejected'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00Z');
  const day = date.getUTCDate();
  const month = date.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export default function DashboardClient({ initialApplicants, initialPositions, userEmail }) {
  const [applicants, setApplicants] = useState(initialApplicants);
  const positions = initialPositions;
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterFlag, setFilterFlag] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return applicants.filter((a) => {
      const missingDoc = a.category !== 'working' && !a.transcript_path;
      if (filterCat && a.category !== filterCat) return false;
      if (filterFlag === 'missing' && !missingDoc) return false;
      if (filterPosition && a.position !== filterPosition) return false;
      if (
        s &&
        !(
          a.name.toLowerCase().includes(s) ||
          a.org.toLowerCase().includes(s) ||
          a.email?.toLowerCase().includes(s) ||
          a.phone?.toLowerCase().includes(s)
        )
      )
        return false;
      return true;
    });
  }, [applicants, search, filterCat, filterFlag, filterPosition]);

  async function handleStatusChange(id, status) {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      await updateStatus(id, status);
    } catch (err) {
      alert('Could not update status: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remove this applicant record? This cannot be undone.')) return;
    setBusyId(id);
    try {
      await deleteApplicant(id);
      setApplicants((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert('Could not delete: ' + err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleViewDoc(path) {
    if (!path) return;
    try {
      const url = await getDocUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert('Could not open document: ' + err.message);
    }
  }

  function exportCSV() {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Position',
      'Category',
      'University/Employer',
      'Program/Role',
      'Internship Start',
      'Internship End',
      'Status',
      'Submitted At',
    ];
    const rows = filtered.map((a) => [
      a.name,
      a.email,
      a.phone,
      a.position,
      CATEGORY_LABEL[a.category],
      a.org,
      a.program_or_role,
      formatDate(a.internship_start_date),
      formatDate(a.internship_end_date),
      a.status,
      a.submitted_at,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'career-fair-applicants.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>CORTEX ROBOTICS</h1>
          <div className="sub">Review Dashboard — signed in as {userEmail}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <ThemeToggle />
          <Link
            className="ghost-link icon-link"
            href="/dashboard/positions"
            title="Manage Positions"
            aria-label="Manage Positions"
          >
            <span aria-hidden="true">&#9881;&#65038;</span>
          </Link>
          <button className="ghost-link" onClick={() => signOut()} type="button">
            Sign Out
          </button>
        </div>
      </header>

      <StatsPanel applicants={applicants} />

      <PositionsPanel applicants={applicants} positions={positions} />

      <div className="card">
        <div className="toolbar">
          <input
            type="text"
            placeholder="Search name, email, phone, university, employer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
            <option value="">All categories</option>
            <option value="intern">Intern</option>
            <option value="grad">Grad / Job-seeking</option>
            <option value="working">Already Working</option>
          </select>
          <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}>
            <option value="">All positions</option>
            {positions.map((p) => (
              <option key={p.id} value={p.title}>
                {p.title}
              </option>
            ))}
          </select>
          <select value={filterFlag} onChange={(e) => setFilterFlag(e.target.value)}>
            <option value="">All statuses</option>
            <option value="missing">Missing documents only</option>
          </select>
          <button className="ghost" onClick={exportCSV} type="button">
            Export CSV
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Position</th>
                <th>Category</th>
                <th>University/Employer</th>
                <th>Program/Role</th>
                <th>Internship Start</th>
                <th>Internship End</th>
                <th>Resume</th>
                <th>Transcript</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const missingDoc = a.category !== 'working' && !a.transcript_path;
                return (
                  <tr key={a.id}>
                    <td>
                      <select
                        className="status"
                        value={a.status}
                        onChange={(e) => handleStatusChange(a.id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {a.name} {missingDoc && <span className="flag">⚠</span>}
                    </td>
                    <td>{a.email}</td>
                    <td>{a.phone}</td>
                    <td>{a.position}</td>
                    <td>{CATEGORY_LABEL[a.category]}</td>
                    <td>{a.org || '—'}</td>
                    <td>{a.program_or_role || '—'}</td>
                    <td>{formatDate(a.internship_start_date)}</td>
                    <td>{formatDate(a.internship_end_date)}</td>
                    <td>
                      <span
                        className="pill ok"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleViewDoc(a.resume_path)}
                      >
                        View
                      </span>
                    </td>
                    <td>
                      {a.category === 'working' ? (
                        <span className="pill na">N/A</span>
                      ) : a.transcript_path ? (
                        <span
                          className="pill ok"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleViewDoc(a.transcript_path)}
                        >
                          View
                        </span>
                      ) : (
                        <span className="pill bad">Missing</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="ghost"
                        onClick={() => handleDelete(a.id)}
                        disabled={busyId === a.id}
                        type="button"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty">No applicants match — try clearing filters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
