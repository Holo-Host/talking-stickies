<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import { BoardType } from './board';
  
    export let active = false;
    export let boardType:BoardType
</script>
  
<Dialog bind:active width={600}>
    <div class="about">
    {#if boardType == BoardType.Stickies}
        <h5>TalkingStickies: UI v0.2.3 for DNA v0.2.x</h5>
        <p>TalkingStickies is a demonstration Holochain hApp built by Holo.</p>
        <p>
            We use TalkingStickies internally for meetings, agendas, brain-storming sessions and retros. 
            This project's real-time syncronization is powered by <a href="https://github.com/holochain/syn">Syn</a>, 
            a library that makes it really easy to build this kind of real-time collaboaration into Holochain hApps.
        </p>
        <p> TalkingStickies was originally inspired by <a href="https://ideaboardz.com/">IdeaBoardz</a> 

        </p>
    {:else}
        <h5>CanDo!: UI v0.2.0 for DNA v0.2.x</h5>
        <p>KanBan is a demonstration Holochain hApp built by Holo.</p>
        <p>
            This project's real-time syncronization is powered by <a href="https://github.com/holochain/syn">Syn</a>, 
            a library that makes it really easy to build this kind of real-time collaboaration into Holochain hApps.
        </p>
    {/if}
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
  