"use client";

import { useState } from "react";
import { ReactFlowProvider } from "reactflow";
import TestGraph from "./components/TestGraph";

export default function Page() {
  const [repoInput, setRepoInput] = useState("");
  const [repo, setRepo] = useState("");
  const [error, setError] = useState("");

  const handleLoad = () => {
    if (!repoInput.includes("/")) {
      setError("Enter a valid GitHub repo in the format owner/repo");
      return;
    }

    setError("");
    setRepo(""); // trigger re-render in TestGraph with blank to reset

    // Simulate async trigger — set repo after slight delay
    setTimeout(() => {
      setRepo(repoInput.trim());
    }, 100); // 100ms delay ensures React state updates correctly
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="p-4 border-b border-zinc-700 dark:bg-zinc-900 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"></div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLoad();
          }}
          className="mt-4"
        >
          <label
            htmlFor="repo-input"
            className="block text-sm font-medium text-zinc-400 mb-1"
          >
            Enter GitHub Repo:
          </label>
          <div className="flex gap-2 items-center">
            <input
              id="repo-input"
              type="text"
              className="border rounded px-3 py-2 w-full bg-zinc-900 text-white border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. vercel/next.js"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition disabled:opacity-50"
            >
              Load
            </button>
          </div>
          {error && <p className="text-red-500 mt-1">{error}</p>}
        </form>
      </header>

      {/* Graph */}
      <main className="flex-1 min-h-0 relative">
        <ReactFlowProvider>
          <TestGraph repo={repo} />
        </ReactFlowProvider>
      </main>
    </div>
  );
}