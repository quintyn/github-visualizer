import { extractDependencies } from './parseDependencies';
import type { Node, Edge } from 'reactflow';

export function buildGraphFromFiles(files: { path: string; content: string }[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodeSet = new Set<string>();
  const edgeList: Edge[] = [];

  for (const file of files) {
    nodeSet.add(file.path);

    const deps = extractDependencies(file.path, file.content);

    // Only include relative or local-looking imports — skip external packages
    for (const dep of deps) {
      const isLocal =
        dep.target.startsWith('./') ||
        dep.target.startsWith('../') ||
        dep.target.includes('/');

      if (!isLocal) continue;

      edgeList.push({
        id: `${dep.source}->${dep.target}`,
        source: dep.source,
        target: dep.target,
      });

      nodeSet.add(dep.target);
    }
  }

  // Turn the unique file/dependency set into graph nodes
  const nodes: Node[] = Array.from(nodeSet).map((id) => ({
    id,
    data: { label: id.split('/').pop() || id },
    position: { x: 0, y: 0 }, // layout handled separately
  }));

  return { nodes, edges: edgeList };
}