<script lang="ts">
  import { BoardType } from "./board";
  import TSLogoIcon from "./icons/TSLogoIcon.svelte";
  import KBLogoIcon from "./icons/KBLogoIcon.svelte";
  import BoardMenu from "./BoardMenu.svelte";
  import Folk from "./Folk.svelte";
  import { Icon, Button } from 'svelte-materialify';
  import { mdiBug } from '@mdi/js';
  import AboutDialog from "./AboutDialog.svelte";

  export let boardType: BoardType
  let showAbout = false

</script>

{#if showAbout}
  <AboutDialog boardType={boardType} bind:active={showAbout} />
{/if}
<div class='toolbar'>
  <div class="left-items">
    {#if boardType === BoardType.Stickies}
      <div class="logo" title="About TalkingStickies" on:click={()=>showAbout=true}><TSLogoIcon /></div>
    {:else}
      <div class="logo" title="About CanDo!" on:click={()=>showAbout=true}><KBLogoIcon /></div><h4 class="logo-text">CanDo!</h4>
    {/if}
    <BoardMenu boardType={boardType}></BoardMenu>
  </div>
  <div class="right-items">
    <Folk></Folk>
    <Button icon title="Report a problem in our GitHub repo" on:click={()=>window.open("https://github.com/Holo-Host/talking-stickies/issues", '_blank')}>
      <Icon path={mdiBug} style={"color: #3672b9"} />
    </Button>
  </div>
</div>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: white;
    padding-left: 19px;
    padding-right: 10px;
    padding-top: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #222;
  }
  .logo {
    width: 40px;
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