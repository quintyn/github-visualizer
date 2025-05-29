import { describe, it, expect } from 'vitest';
import { extractDependencies } from './parseDependencies';

describe('extractDependencies', () => {
  it('detects ES module imports', () => {
    const content = "import utils from './utils/helpers';";
    const deps = extractDependencies('src/app.ts', content);
    expect(deps).toEqual([{ source: 'src/app.ts', target: './utils/helpers' }]);
  });

  it('detects CommonJS require', () => {
    const content = "const fs = require('./fs-lib');";
    const deps = extractDependencies('lib/io.js', content);
    expect(deps).toEqual([{ source: 'lib/io.js', target: './fs-lib' }]);
  });

  it('detects C-style includes', () => {
    const content = '#include "math.hpp"\n#include <stdio.h>';
    const deps = extractDependencies('main.cpp', content);
    expect(deps).toEqual([
      { source: 'main.cpp', target: 'math.hpp' },
      { source: 'main.cpp', target: 'stdio.h' },
    ]);
  });

  it('ignores unrelated text', () => {
    const content = "console.log('no deps');";
    const deps = extractDependencies('foo.ts', content);
    expect(deps).toEqual([]);
  });

  it('handles multiple dependencies', () => {
    const content = `
      import a from './a';
      const b = require('./b');
      #include "header.hpp"
    `;
    const deps = extractDependencies('main.ts', content);
    expect(deps).toEqual([
      { source: 'main.ts', target: './a' },
      { source: 'main.ts', target: './b' },
      { source: 'main.ts', target: 'header.hpp' },
    ]);
  });

  it('returns empty list for files with no imports', () => {
    const content = '// just a comment';
    const deps = extractDependencies('empty.ts', content);
    expect(deps).toEqual([]);
  });

  it('ignores type-only imports', () => {
    const content = "import type { Foo } from 'types';";
    const deps = extractDependencies('types.ts', content);
    expect(deps).toEqual([]);
  });

  it('ignores imports inside comments', () => {
    const content = `
      // import foo from 'bar';
      /* import baz from 'qux'; */
    `;
    const deps = extractDependencies('commented.ts', content);
    expect(deps).toEqual([]);
  });

  it('handles dynamic imports', () => {
    const content = `const lib = await import('dynamic-lib');`;
    const deps = extractDependencies('dynamic.ts', content);
    expect(deps).toEqual([{ source: 'dynamic.ts', target: 'dynamic-lib' }]);
  });

  it('handles multiple imports on one line', () => {
    const content = `import { A, B } from "multi";`;
    const deps = extractDependencies('multi.ts', content);
    expect(deps).toEqual([{ source: 'multi.ts', target: 'multi' }]);
  });

  it('handles circular imports (A <-> B)', () => {
    const fileA = `import B from './B';`;
    const fileB = `import A from './A';`;

    const depsA = extractDependencies('A.ts', fileA);
    const depsB = extractDependencies('B.ts', fileB);

    expect(depsA).toEqual([{ source: 'A.ts', target: './B' }]);
    expect(depsB).toEqual([{ source: 'B.ts', target: './A' }]);
  });

  it('ignores CSS/image imports if configured to do so', () => {
    const content = `
      import './styles.css';
      import logo from './logo.png';
    `;
    const deps = extractDependencies('assets.ts', content);

    expect(deps).toEqual([]);
  });
});