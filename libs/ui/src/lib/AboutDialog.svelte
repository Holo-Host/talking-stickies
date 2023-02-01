<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import { BoardType } from './board';
  
    export let active = false;
    export let boardType:BoardType
</script>
  
<Dialog bind:active>
    <div class="about">
    {#if boardType == BoardType.Stickies}
        <h5>TalkingStickies: UI v0.2.2 for DNA v0.2.x</h5>
        <p>TalkingStickies is a demonstration Holochain hApp built by Holo.</p>
        <p>We use it regularly ourselves to coordinate our meetings, agendas, brain-storming sessions and retros. We acknowledge inspriation of <a href="https://ideaboardz.com/">IdeaBoardz</a> </p>
    {:else}
        <h5>KanBan: UI v0.2.0 for DNA v0.2.x</h5>
        <p>KanBan is a demonstration Holochain hApp built by Holo.</p>
    {/if}
    <p>This project's real-time syncronization is powered by <a href="https://github.com/holochain/syn">syn</a>, 
        a library that makes it really easy to build this kind of real-time collaboaration into Holochain hApps.
    </p>
    </div>
</Dialog>

<style>
    .about {
        padding: 10px;
    }
</style>
  