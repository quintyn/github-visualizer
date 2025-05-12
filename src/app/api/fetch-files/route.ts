import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

// Basic import/include parser
function extractDependencies(source: string, content: string) {
  const deps: { source: string; target: string }[] = [];

  const patterns = [
    /import\s+.*?['"](.+?)['"]/g,
    /require\(['"](.+?)['"]\)/g,
    /#include\s+["<](.*?)[">]/g,
  ];

  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      const target = match[1];
      if (target.startsWith('.') || target.endsWith('.h') || target.endsWith('.hpp') || target.endsWith('.inl')) {
        deps.push({ source, target });
      }
    }
  }

  return deps;
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const repoParam = url.searchParams.get('repo'); // expects: owner/repo

  if (!repoParam) {
    return NextResponse.json({ error: 'Missing ?repo=owner/repo param' }, { status: 400 });
  }

  const [owner, repo] = repoParam.split('/');
  if (!owner || !repo) {
    return NextResponse.json({ error: 'Invalid repo format' }, { status: 400 });
  }

  try {
    // Get the repo's default branch
    const repoData = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.data.default_branch;

    // Fetch all files in the tree
    const treeResponse = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: 'true',
    });

    // Filter to relevant code files
    const filteredFiles = treeResponse.data.tree.filter(
      (item) => item.path?.match(/\.(ts|tsx|js|jsx|cpp|h|c|hpp|inl|py|go)$/) && item.type === 'blob'
    );

    const nodes: Set<string> = new Set();
    const edges: { source: string; target: string }[] = [];

    // Fetch + decode content and extract imports
    for (const file of filteredFiles) {
      try {
        const contentRes = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path!,
          ref: defaultBranch,
        });

        if (!Array.isArray(contentRes.data) && contentRes.data.type === 'file') {
          const decoded = Buffer.from(contentRes.data.content, 'base64').toString('utf8');
          nodes.add(file.path!);

          const deps = extractDependencies(file.path!, decoded);

          for (const dep of deps) {
            edges.push(dep);
            nodes.add(dep.target);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Skipping file ${file.path}:`, message);
      }
    }

    // Return graph data
    return NextResponse.json({
      nodes: Array.from(nodes).map((id) => ({ id })),
      edges,
    });
  } catch (error) {
    console.error('GitHub API error:', error);
    return NextResponse.json({ error: 'Failed to fetch repo data' }, { status: 500 });
  }
}