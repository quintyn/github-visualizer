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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between mb-4 items-center">
        <h2 className="text-xl font-semibold">GitHub Dependency Visualizer</h2>
        <ThemeToggle />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Enter GitHub Repo:</label>
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

      <TestGraph repo={repo} />
    </div>
  );
}