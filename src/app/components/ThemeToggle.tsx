'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount: determine initial theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark =
      savedTheme === 'dark' ||
      (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    setMounted(true);
  }, []);

  // When toggled, update root class and persist preference
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark, mounted]);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setDark((prev) => !prev)}
      className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
    >
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}