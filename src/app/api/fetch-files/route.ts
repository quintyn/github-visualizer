import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

const memoryCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_DURATION_MS = 10 * 60 * 1000;

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
      if (
        target.startsWith('.') ||
        target.endsWith('.h') ||
        target.endsWith('.hpp') ||
        target.endsWith('.inl')
      ) {
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
  const repoParam = url.searchParams.get('repo');

  if (!repoParam) {
    return NextResponse.json({ error: 'Missing ?repo=owner/repo param' }, { status: 400 });
  }

  const [owner, repo] = repoParam.split('/');
  if (!owner || !repo) {
    return NextResponse.json({ error: 'Invalid repo format' }, { status: 400 });
  }

  const cacheKey = `${owner}/${repo}`;
  const cached = memoryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const repoData = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.data.default_branch;

    const treeResponse = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "true", // Fix for TS error
    });

    const filteredFiles = treeResponse.data.tree
      .filter(
        (item) =>
          item.path?.match(/\.(ts|tsx|js|jsx|cpp|h|c|hpp|inl|py|go)$/) &&
          item.type === 'blob'
      )
      .slice(0, 100); // Cap to 100 files max

    const nodes: Set<string> = new Set();
    const edges: { source: string; target: string }[] = [];

    for (const file of filteredFiles) {
      try {
        console.log(`Processing ${file.path}`);

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

    const graphData = {
      nodes: Array.from(nodes).map((id) => ({ id })),
      edges,
    };

    memoryCache.set(cacheKey, { timestamp: Date.now(), data: graphData });

    return NextResponse.json(graphData);
  } catch (error) {
    console.error('GitHub API error:', error);
    return NextResponse.json({ error: 'Failed to fetch repo data' }, { status: 500 });
  }
}