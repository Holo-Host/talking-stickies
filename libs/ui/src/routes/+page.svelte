<script>
	import Toolbar from "$lib/Toolbar.svelte";
  import BoardEditor from "../lib/BoardEditor.svelte";
  import BoardPane from "../lib/BoardPane.svelte";
  import StickyEditor from "../lib/StickyEditor.svelte";
  import { BoardType } from "$lib";

</script>
<h4>Welcome to your library project</h4>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<Toolbar boardType={BoardType.Stickies}></Toolbar>
