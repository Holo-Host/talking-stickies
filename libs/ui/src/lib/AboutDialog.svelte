<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import { BoardType } from './board';
    import { onMount, onDestroy } from 'svelte';

    export let active = false;
    export let boardType:BoardType

    onMount(() => {
        document.addEventListener('keydown', handleKeydown, {
                capture: true
            });
    })
	
	onDestroy(() => {
        document.removeEventListener('keydown', handleKeydown, {
                capture: true
            });
    })
    const handleKeydown = (e) => {
        if (e.key === "Escape") {
            active=false
        }
    }
</script>
  
<Dialog bind:active width={600} >
    <div class="about">
    {#if boardType == BoardType.Stickies}
        <h5>TalkingStickies: UI v0.2.7 for DNA v0.2.x</h5>
        <p>TalkingStickies is a demonstration Holochain app built by Holo.</p>
        <p>
            We use TalkingStickies internally for meetings, agendas, brain-storming sessions and retros.
        </p>
        <p> TalkingStickies was originally inspired by <a href="https://ideaboardz.com/">IdeaBoardz</a> 

        </p>
    {:else}
        <h5>CanDo!: UI v0.2.2 for DNA v0.2.x</h5>
        <p>CanDo! is a demonstration Holochain app built by Holo.</p>
    {/if}
    <p> <b>Developers:</b>
        Check out this hApp's source-code <a href="https://github.com/Holo-Host/talking-stickies">in our github repo</a>.
        This project's real-time syncronization is powered by <a href="https://github.com/holochain/syn">Syn</a>, 
        a library that makes it really easy to build this kind of real-time collaboaration into Holochain apps.
    </p>
    <p class="small">Copyright © 2023 Holo, LTD.  This software is distributed under the <a href="https://opensource.org/licenses/CAL-1.0">CAL-1.0 License</a></p>
    </div>
</Dialog>

<style>
    .about {
        padding: 40px;
    }
    .about h5 {
        margin-bottom: 40px;
    }
    .small {
        font-size: 80%;
    }
</style>
  