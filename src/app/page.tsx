'use client';

import { useState } from 'react';
import TestGraph from './components/TestGraph';
import ThemeToggle from './components/ThemeToggle';

export default function Page() {
  const [repoInput, setRepoInput] = useState('');
  const [repo, setRepo] = useState('');
  const [error, setError] = useState('');

  const handleLoad = () => {
    if (!repoInput.includes('/')) {
      setError('Enter a valid GitHub repo in the format owner/repo');
      return;
    }
    setRepo(repoInput.trim());
    setError('');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top section with title, input, and theme toggle */}
      <div className="p-4 border-b border-zinc-700 dark:bg-zinc-900 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">GitHub Dependency Visualizer</h2>
          <ThemeToggle />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-300">Enter GitHub Repo:</label>
          <div className="flex gap-2">
            <input
              type="text"
              className="border rounded px-2 py-1 w-full bg-zinc-900 text-white border-zinc-700"
              placeholder="e.g. vercel/next.js"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
              onClick={handleLoad}
            >
              Load
            </button>
          </div>
          {error && <p className="text-red-500 mt-1">{error}</p>}
        </div>
      </div>

      {/* Graph fills remaining space */}
      <div className="flex-1 min-h-0">
        <TestGraph repo={repo} />
      </div>
    </div>
  );
}