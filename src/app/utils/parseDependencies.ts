export type Dependency = {
  source: string;
  target: string;
};

export function extractDependencies(source: string, content: string): Dependency[] {
  const deps: Dependency[] = [];

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