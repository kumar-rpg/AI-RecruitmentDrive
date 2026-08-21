'use client';

import { useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { validateMobilePasscode } from './actions';

export default function MobileAuth({ onSubmit }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  function handleDigitClick(digit) {
    if (passcode.length < 6) {
      setPasscode(passcode + digit);
    }
  }

  function handleClear() {
    setPasscode('');
    setError('');
  }

  function handleBackspace() {
    if (passcode.length > 0) {
      setPasscode(passcode.slice(0, -1));
    }
  }

  async function handleSubmit() {
    if (passcode.length !== 6) {
      setError('Please enter a 6-digit passcode.');
      return;
    }
    setError('');
    try {
      const isValid = await validateMobilePasscode(passcode);
      if (isValid) {
        onSubmit(true);
      } else {
        setError('Incorrect passcode. Please try again.');
        setPasscode('');
      }
    } catch (err) {
      setError('Authentication error. Please try again.');
      setPasscode('');
    }
  }

  return (
    <div className="mobile-auth">
      <header className="mobile-header">
        <div>
          <h1>CORTEX ROBOTICS</h1>
          <div className="sub">Mobile Dashboard</div>
        </div>
        <ThemeToggle />
      </header>

      <div className="mobile-auth-card">
        <h2>Enter Passcode</h2>
        <p className="mobile-auth-hint">6-digit passcode required</p>

        <div className="passcode-display">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={'passcode-dot' + (i < passcode.length ? ' filled' : '')} />
          ))}
        </div>

        {error && <div className="mobile-error">{error}</div>}

        <div className="passcode-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              className="keypad-btn"
              onClick={() => handleDigitClick(String(digit))}
              type="button"
            >
              {digit}
            </button>
          ))}
          <button className="keypad-btn" onClick={() => handleDigitClick('0')} type="button">
            0
          </button>
          <button className="keypad-btn danger" onClick={handleBackspace} type="button">
            ⌫
          </button>
        </div>

        <div className="mobile-actions">
          <button className="ghost-secondary" onClick={handleClear} type="button" title="Clear">
            ✕
          </button>
          <button
            className="primary-mobile"
            onClick={handleSubmit}
            disabled={passcode.length !== 6}
            type="button"
            title="Submit"
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
