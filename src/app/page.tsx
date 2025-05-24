'use client';

import { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import TestGraph from './components/TestGraph';
import ThemeToggle from './components/ThemeToggle';

export default function Page() {
  const [repoInput, setRepoInput] = useState('');
  const [repo, setRepo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoad = () => {
    if (!repoInput.includes('/')) {
      setError('Enter a valid GitHub repo in the format owner/repo');
      return;
    }

    setLoading(true);
    setError('');
    setRepo('');
    setRepo(repoInput.trim());
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header section */}
      <div className="p-4 border-b border-zinc-700 dark:bg-zinc-900 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <label
            className="block text-sm font-medium text-zinc-300"
            htmlFor="repo-input"
          >
            GitHub Dependency Visualizer
          </label>
          <ThemeToggle />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLoad();
          }}
        >
          <label
            className="block text-sm font-medium mb-1 text-zinc-300"
            htmlFor="repo-input"
          >
            Enter GitHub Repo:
          </label>
          <div className="flex gap-2 items-center">
            <input
              id="repo-input"
              type="text"
              className="border rounded px-2 py-1 w-full bg-zinc-900 text-white border-zinc-700"
              placeholder="e.g. vercel/next.js"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              disabled={loading}
              aria-label="GitHub repository input"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-1">{error}</p>}
        </form>
      </div>

      {/* Graph area */}
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white" />
          </div>
        )}
        <ReactFlowProvider>
          <TestGraph repo={repo} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}