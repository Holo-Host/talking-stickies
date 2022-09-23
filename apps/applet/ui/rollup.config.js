import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import css from 'rollup-plugin-merge-and-inject-css';
//import css2 from "rollup-plugin-import-css";

const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require('child_process').spawn(
        'npm',
        ['run', 'start', '--', '--dev'],
        {
          stdio: ['ignore', 'inherit', 'inherit'],
          shell: true,
        }
      );

      process.on('SIGTERM', toExit);
      process.on('exit', toExit);
    },
  };
}

// only allow env variables that start with SVELTE_APP_
const envKeys = Object.keys(process.env);
const env = envKeys
  .filter(key => key.startsWith('SVELTE_APP_'))
  .reduce((acc, key) => {
    acc[key] = process.env[key];
    return acc;
  }, {});
export default {
  input: 'src/index.ts',
  output: {
    format: 'es',
    dir: 'dist',
    sourcemap: false,
  },
  plugins: [
    replace({
      'process.env': JSON.stringify({
        NODE_ENV: process.env.NODE,
        ...env,
      }),
    }),
    copy({
      targets: [{ src: 'icon.png', dest: 'dist' }, { src: 'icon.svg', dest: 'dist' }],
    }),
    svelte({
      emitCss: false,
     // preprocess: sveltePreprocess(),
      compilerOptions: {
        // enable run-time checks when not in production
        dev: !production,
      },
    }),
	//css({id:'talking-stickies-id'}),
	//css2(),
    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),
    typescript({
      sourceMap: !production,
      inlineSources: !production,
    }),

    // In dev mode, call `npm run start` once
    // the bundle has been generated
    !production && serve(),

    // Watch the `public` directory and refresh the
    // browser on changes when not in production
    !production && livereload('public'),

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
