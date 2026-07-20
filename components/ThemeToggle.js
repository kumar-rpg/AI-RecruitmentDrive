'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersLight =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const initial = saved || (prefersLight ? 'light' : 'dark');
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  return (
    <button id="theme-toggle" onClick={toggle} type="button">
      {theme === 'light' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
