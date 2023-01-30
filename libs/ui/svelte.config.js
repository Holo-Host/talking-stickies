import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),
	onwarn: (warning, handler) => {
		if (warning.code.startsWith('a11y-')) {
		  return;
		}
		handler(warning);
	  },
  
	kit: {
		adapter: adapter()
	}
};

export default config;
