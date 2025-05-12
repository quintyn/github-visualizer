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
            }
            reviews(first: 10) {
              nodes {
                author {
                  login
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

    const edges = new Set<string>();
    const nodes = new Set<string>();

    for (const pr of pulls) {
      const target = pr?.author?.login;
      if (!target) continue;
      nodes.add(target);

      for (const review of pr.reviews?.nodes || []) {
        const source = review?.author?.login;
        if (!source || source === target) continue;

        nodes.add(source);
        edges.add(`${source}→${target}`);
      }
    }

    return NextResponse.json({
      nodes: Array.from(nodes).map((id) => ({ id })),
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