import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const repoParam = url.searchParams.get('repo'); // expects "owner/repo"

  if (!repoParam) {
    return NextResponse.json({ error: 'Missing ?repo=owner/repo param' }, { status: 400 });
  }

  const [owner, repo] = repoParam.split('/');
  if (!owner || !repo) {
    return NextResponse.json({ error: 'Invalid repo format' }, { status: 400 });
  }

  const query = `
    query($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        pullRequests(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            author {
              login
              avatarUrl
            }
            reviews(first: 10) {
              nodes {
                author {
                  login
                  avatarUrl
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { owner, repo } }),
    });

    const result = await response.json();

    if (!result.data || !result.data.repository?.pullRequests?.nodes) {
      throw new Error('Invalid GraphQL response');
    }

    const pulls = result.data.repository.pullRequests.nodes;

    const nodeMap = new Map<string, { id: string; label: string; avatarUrl: string }>();
    const edges = new Set<string>();

    for (const pr of pulls) {
      const target = pr?.author;
      if (!target?.login) continue;

      nodeMap.set(target.login, {
        id: target.login,
        label: target.login,
        avatarUrl: target.avatarUrl,
      });

      for (const review of pr.reviews?.nodes || []) {
        const source = review?.author;
        if (!source?.login || source.login === target.login) continue;

        nodeMap.set(source.login, {
          id: source.login,
          label: source.login,
          avatarUrl: source.avatarUrl,
        });

        edges.add(`${source.login}→${target.login}`);
      }
    }

    return NextResponse.json({
      nodes: Array.from(nodeMap.values()),
      edges: Array.from(edges).map((e, i) => {
        const [source, target] = e.split('→');
        return { id: `e-${i}`, source, target };
      }),
    });
  } catch (err) {
    console.error('GraphQL error:', err);
    return NextResponse.json({ error: 'Failed to fetch contributors' }, { status: 500 });
  }
}