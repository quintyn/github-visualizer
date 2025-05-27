// src/app/utils/parseDependencies.test.ts

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
  { source: 'main.cpp', target: 'stdio.h' },]);
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
});