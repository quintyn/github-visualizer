'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark((prev) => !prev)}
      className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
    >
      {dark ? 'Light mode' : 'Dark mode'}
    </button>
  );
}