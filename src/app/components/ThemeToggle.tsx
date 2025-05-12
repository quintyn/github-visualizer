'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false); // Avoid SSR hydration mismatch

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', dark);
    }
  }, [dark, mounted]);

  // Don’t render until client-side mount to avoid mismatch with SSR
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