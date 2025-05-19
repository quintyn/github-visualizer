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
            createdAt
            reviews(first: 10) {
              nodes {
                author {
                  login
                  avatarUrl
                }
                submittedAt
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

    if (!result.data || !result.data.repository) {
  console.error('GraphQL response missing repository field:', result);
  throw new Error('Invalid GraphQL response');
}

if (!result.data.repository.pullRequests?.nodes) {
  console.warn(`No pull requests found for ${owner}/${repo}`);
  return NextResponse.json({
    nodes: [],
    edges: [],
    message: 'No contributor data available for this repository.',
  });
}
    const pulls = result.data.repository.pullRequests.nodes;

    type ContributorInfo = {
      id: string;
      label: string;
      avatarUrl: string;
      prCount: number;
      reviewCount: number;
      lastActivity: string | null;
    };

    const nodeMap = new Map<string, ContributorInfo>();
    const edges = new Set<string>();

    for (const pr of pulls) {
      const prAuthor = pr?.author;
      const prDate = pr?.createdAt;

      if (prAuthor?.login) {
        const user = prAuthor.login;
        const avatar = prAuthor.avatarUrl;

        const existing = nodeMap.get(user);
        nodeMap.set(user, {
          id: user,
          label: user,
          avatarUrl: avatar,
          prCount: (existing?.prCount || 0) + 1,
          reviewCount: existing?.reviewCount || 0,
          lastActivity: getLatest(existing?.lastActivity, prDate),
        });
      }

      for (const review of pr.reviews?.nodes || []) {
        const reviewer = review?.author;
        const reviewDate = review?.submittedAt;

        if (!reviewer?.login || reviewer.login === prAuthor?.login) continue;

        const user = reviewer.login;
        const avatar = reviewer.avatarUrl;

        const existing = nodeMap.get(user);
        nodeMap.set(user, {
          id: user,
          label: user,
          avatarUrl: avatar,
          prCount: existing?.prCount || 0,
          reviewCount: (existing?.reviewCount || 0) + 1,
          lastActivity: getLatest(existing?.lastActivity, reviewDate),
        });

        edges.add(`${user}→${prAuthor.login}`);
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

function getLatest(a: string | null | undefined, b: string | null | undefined): string | null {
  if (!a) return b || null;
  if (!b) return a || null;
  return new Date(a) > new Date(b) ? a : b;
}