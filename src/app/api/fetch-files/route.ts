import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

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
    const repoData = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoData.data.default_branch;

    const treeResponse = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: 'true',
    });

    const filteredFiles = treeResponse.data.tree.filter(
      (item) => item.path?.match(/\.(ts|tsx|js|jsx|cpp|h|c|hpp|inl)$/) && item.type === 'blob'
    );

    const fileContents = [];

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
          fileContents.push({ path: file.path, content: decoded });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Skipping file ${file.path}:`, message);
      }      
    }

    return NextResponse.json({ files: fileContents });
  } catch (error) {
    console.error('GitHub API error:', error);
    return NextResponse.json({ error: 'Failed to fetch repo data' }, { status: 500 });
  }
}