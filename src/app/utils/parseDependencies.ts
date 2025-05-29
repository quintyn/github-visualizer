export type Dependency = {
  source: string;
  target: string;
};

export function extractDependencies(source: string, content: string): Dependency[] {
  const deps: Dependency[] = [];

  // Remove comments (both single and multi-line)
  const codeWithoutComments = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//gm, '');

  const patterns = [
    // Handles: import 'x', import x from 'x', import { x } from 'x'
    /\bimport(?:\s+(?:[\w*\s{},]+)\s+from)?\s*['"]([^'"]+)['"]/g,

    // Handles: dynamic imports like import('x') or await import('x')
    /\b(?:await\s+)?import\(\s*['"]([^'"]+)['"]\s*\)/g,

    // Handles: require('x')
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,

    // Handles: #include "x" or #include <x>
    /#include\s+[<"]([^">]+)[">]/g,
  ];

  const excludedExtensions = ['.css', '.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];

  for (const pattern of patterns) {
    for (const match of codeWithoutComments.matchAll(pattern)) {
      const fullMatch = match[0];
      const target = match[1];

      // Skip type-only imports
      if (/import\s+type\b/.test(fullMatch)) continue;

      // Skip assets
      if (excludedExtensions.some(ext => target.endsWith(ext))) continue;

      // Include all relevant imports now — bare module names like "multi" or "dynamic-lib" are valid too
      deps.push({ source, target });
    }
  }

  return deps;
}