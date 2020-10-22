import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import sourceMaps from "rollup-plugin-sourcemaps";
import typescript from "rollup-plugin-typescript2";
import babel from "rollup-plugin-babel";
import uglify from "rollup-plugin-uglify-es";

const pkg = require("./package.json");

export default [
  {
    input: `src/o.ts`,
    output: [
      {
        file: pkg.browser.replace(".js", ".min.js"),
        name: "odata",
        format: "umd",
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        useTsconfigDeclarationDir: true,
      }),
      commonjs(),
      resolve({
        browser: true,
      }),
      babel({
        exclude: "node_modules/**",
      }),
      uglify(),
      sourceMaps(),
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
      include: "src/**",
    },
  },
  {
    input: `src/o.ts`,
    output: [
      {
        file: pkg.browser,
        name: "odata",
        format: "umd",
        sourcemap: true,
      },
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        useTsconfigDeclarationDir: true,
      }),
      commonjs(),
      resolve({
        browser: true,
      }),
      babel({
        exclude: "node_modules/**",
      }),
      sourceMaps(),
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
      include: "src/**",
    },
  },
  {
    input: `src/o.ts`,
    output: [
      {
        file: pkg.main,
        name: "odata",
        format: "cjs",
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        useTsconfigDeclarationDir: true,
        noResolve: true,
      }),
      resolve({
        browser: false,
      }),
      sourceMaps(),
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
      include: "src/**",
    },
  },
  {
    input: `src/o.polyfill.ts`,
    output: [
      {
        file: 'dist/umd/o.polyfill.js',
        name: "o.polyfill",
        format: "umd",
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        useTsconfigDeclarationDir: true,
      }),
      commonjs(),
      resolve({
        browser: true,
      }),
      uglify(),
      sourceMaps(),
    ],
    watch: {
      include: "src/**",
    },
  },
];
