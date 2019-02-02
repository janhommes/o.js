import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import sourceMaps from 'rollup-plugin-sourcemaps'
import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import builtins from 'rollup-plugin-node-builtins';

const pkg = require('./package.json')

export default [{
  input: `src/o.ts`,
  output: [{
      file: pkg.browser,
      name: 'odata',
      format: 'umd',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    }
  ],
  plugins: [
    json(),
    typescript({
      useTsconfigDeclarationDir: true
    }),
    commonjs(),
    resolve({
      browser: true
    }),
    sourceMaps(),
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: 'src/**',
  }
}, {
  input: `src/o.ts`,
  output: [{
    file: pkg.main,
    name: 'odata',
    format: 'cjs',
    sourcemap: true,
  }],
  plugins: [
    json(),
    typescript({
      useTsconfigDeclarationDir: true,
      noResolve: true
    }),
    resolve({
      browser: false
    }),
    /*builtins(),
    commonjs({
      namedExports: {
        'node_modules/punycode/punycode.js': ['toASCII']
      }
    }),*/
    sourceMaps(),
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: 'src/**',
  }
}]