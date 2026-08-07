'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { createPosition, togglePositionActive, deletePosition } from '../actions';

export default function PositionsManager({ initialPositions }) {
  const [positions, setPositions] = useState(initialPositions);
  const [newPositionTitle, setNewPositionTitle] = useState('');
  const [positionError, setPositionError] = useState('');
  const [positionBusyId, setPositionBusyId] = useState(null);

  async function handleAddPosition(e) {
    e.preventDefault();
    setPositionError('');
    const title = newPositionTitle.trim();
    if (!title) return;
    try {
      await createPosition(title);
      setPositions((prev) => [...prev, { id: crypto.randomUUID(), title, is_active: true }]);
      setNewPositionTitle('');
    } catch (err) {
      setPositionError(err.message);
    }
  }

  async function handleTogglePosition(id, isActive) {
    setPositions((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)));
    try {
      await togglePositionActive(id, isActive);
    } catch (err) {
      alert('Could not update position: ' + err.message);
    }
  }

  async function handleDeletePosition(id) {
    if (!confirm('Remove this position? Past applications will keep the title on record.')) return;
    setPositionBusyId(id);
    try {
      await deletePosition(id);
      setPositions((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert('Could not delete position: ' + err.message);
    } finally {
      setPositionBusyId(null);
    }
  }

  return (
    <div className="wrap">
      <header className="page-header">
        <div>
          <h1>CORTEX ROBOTICS</h1>
          <div className="sub">Settings — Manage Positions</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <ThemeToggle />
          <Link className="ghost-link" href="/dashboard">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="card">
        <label>Add a Position</label>
        <form
          onSubmit={handleAddPosition}
          style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}
        >
          <input
            type="text"
            placeholder="e.g. Firmware Engineer Intern"
            value={newPositionTitle}
            onChange={(e) => setNewPositionTitle(e.target.value)}
          />
          <button className="primary" type="submit" style={{ marginTop: 0, whiteSpace: 'nowrap' }}>
            Add Position
          </button>
        </form>
        {positionError && <div className="err">{positionError}</div>}
        <div className="hint">
          Positions marked Open appear in the dropdown on the public application form. Click a
          pill to open or close a position.
        </div>

        <div className="table-wrap" style={{ marginTop: '16px' }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Open on Form</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>
                    <span
                      className={'pill ' + (p.is_active ? 'ok' : 'na')}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleTogglePosition(p.id, !p.is_active)}
                    >
                      {p.is_active ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="ghost"
                      onClick={() => handleDeletePosition(p.id)}
                      disabled={positionBusyId === p.id}
                      type="button"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {positions.length === 0 && <div className="empty">No positions yet — add one above.</div>}
        </div>
      </div>
    </div>
  );
}
