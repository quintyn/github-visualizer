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
    for (const dep of deps) {
      edgeList.push({ id: `${dep.source}->${dep.target}`, source: dep.source, target: dep.target });
      nodeSet.add(dep.target);
    }
  }

  const nodes: Node[] = Array.from(nodeSet).map((id) => ({
    id,
    data: { label: id.split('/').pop() || id },
    position: { x: 0, y: 0 }, // layout handled later
  }));

  return { nodes, edges: edgeList };
}