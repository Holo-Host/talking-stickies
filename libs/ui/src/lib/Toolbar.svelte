<script lang="ts">
  import { BoardType } from "./board";
  import TSLogoIcon from "./icons/TSLogoIcon.svelte";
  import KDLogoIcon from "./icons/KDLogoIcon.svelte";
  import BoardMenu from "./BoardMenu.svelte";
  import Folk from "./Folk.svelte";
  import { Icon, Button } from 'svelte-materialify';
  import { mdiBug } from '@mdi/js';
  import AboutDialog from "./AboutDialog.svelte";
  import type { ProfilesStore } from "@holochain-open-dev/profiles";

  export let profilesStore: ProfilesStore|undefined

  export let boardType: BoardType
  let showAbout = false
  $:bugColor = boardType==BoardType.Stickies ? "color: #3672b9" : "color: #5536f9"
</script>

{#if showAbout}
  <AboutDialog boardType={boardType} bind:active={showAbout} />
{/if}
<div class='toolbar'>
  <div class="left-items">
    {#if boardType === BoardType.Stickies}
      <div class="logo" title="About TalkingStickies" on:click={()=>showAbout=true}><TSLogoIcon /></div>
    {:else}
      <div class="logo" title="About KanDo!" on:click={()=>showAbout=true}><KDLogoIcon /></div>
    {/if}
    <BoardMenu boardType={boardType}></BoardMenu>
  </div>
  <div class="right-items">
    <Folk profilesStore={profilesStore}></Folk>
    <a class="bug-link" href="https://github.com/Holo-Host/talking-stickies/issues" title="Report a problem in our GitHub repo" target="_blank">
      <Icon path={mdiBug} style={bugColor} />
    </a>
  </div>
</div>

<style>
  .bug-link {
    padding: 8px 8px;
    display: flex;
    border-radius: 50%;
  }
  a:hover.bug-link {
    background-color: #ddd;
  }
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #eeeeee;
    padding-left: 15px;
    padding-right: 10px;
    padding-top: 16px;
    padding-bottom: 16px;
  }
  .logo {
    height: 40px;
    margin-right: 10px;
    display: contents;
    cursor: pointer;
  }
  .logo-text {
    padding-bottom: 5px;
    margin-left: 15px;
  }
  .right-items {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
  .left-items {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }
</style>