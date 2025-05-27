import { describe, it, expect } from 'vitest';
import { buildGraphFromFiles } from './buildGraph';

// Mock examples
const simpleFile = {
  path: 'main.ts',
  content: `import './utils';`
};

const withMultipleDeps = {
  path: 'utils/helper.js',
  content: `import './math';\nimport './logger';`
};

const withCircularDepsA = {
  path: 'a.ts',
  content: `import './b';`
};
const withCircularDepsB = {
  path: 'b.ts',
  content: `import './a';`
};

const withNoImports = {
  path: 'index.js',
  content: `console.log('Hello World');`
};

const withComments = {
  path: 'comments.js',
  content: `// import './not-used';\nimport './actual';`
};

const withRelativeAndNamedImports = {
  path: 'feature.ts',
  content: `import { something } from '../shared';\nimport externalLib from 'external-lib';`
};

describe('buildGraphFromFiles', () => {
  it('handles a single file with no deps', () => {
    const result = buildGraphFromFiles([{ path: 'solo.ts', content: '' }]);
    expect(result.nodes.map((n) => n.id)).toEqual(['solo.ts']);
    expect(result.edges).toEqual([]);
  });

  it('detects one import dependency', () => {
    const result = buildGraphFromFiles([simpleFile]);
    expect(result.nodes.map((n) => n.id)).toContain('main.ts');
    expect(result.nodes.map((n) => n.id)).toContain('./utils');
    expect(result.edges).toEqual([
      { id: 'main.ts->./utils', source: 'main.ts', target: './utils' }
    ]);
  });

  it('handles multiple dependencies in a single file', () => {
    const result = buildGraphFromFiles([withMultipleDeps]);
    expect(result.nodes.map(n => n.id)).toEqual(
      expect.arrayContaining(['utils/helper.js', './math', './logger'])
    );
    expect(result.edges.length).toBe(2);
  });

  it('handles circular dependencies', () => {
    const result = buildGraphFromFiles([withCircularDepsA, withCircularDepsB]);
    expect(result.edges).toEqual(
      expect.arrayContaining([
        { id: 'a.ts->./b', source: 'a.ts', target: './b' },
        { id: 'b.ts->./a', source: 'b.ts', target: './a' }
      ])
    );
  });

  it('ignores files with no imports', () => {
    const result = buildGraphFromFiles([withNoImports]);
    expect(result.nodes.map(n => n.id)).toEqual(['index.js']);
    expect(result.edges).toEqual([]);
  });

  it('ignores commented out imports', () => {
    const result = buildGraphFromFiles([withComments]);
    expect(result.nodes.map(n => n.id)).toEqual(
      expect.arrayContaining(['comments.js', './actual'])
    );
    expect(result.nodes.map(n => n.id)).not.toContain('./not-used');
    expect(result.edges).toEqual([
      { id: 'comments.js->./actual', source: 'comments.js', target: './actual' }
    ]);
  });

  it('skips external package imports but keeps relative ones', () => {
    const result = buildGraphFromFiles([withRelativeAndNamedImports]);
    expect(result.nodes.map(n => n.id)).toEqual(
      expect.arrayContaining(['feature.ts', '../shared'])
    );
    expect(result.nodes.map(n => n.id)).not.toContain('external-lib');
    expect(result.edges).toEqual([
      { id: 'feature.ts->../shared', source: 'feature.ts', target: '../shared' }
    ]);
  });
});
