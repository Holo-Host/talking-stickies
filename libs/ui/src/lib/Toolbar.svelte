<script lang="ts">
  import { BoardType } from "./board";
  import TSLogoIcon from "./icons/TSLogoIcon.svelte";
  import KBLogoIcon from "./icons/KBLogoIcon.svelte";
  import BoardMenu from "./BoardMenu.svelte";
  import Folk from "./Folk.svelte";
  import { Icon, Button } from 'svelte-materialify';
  import { mdiBug } from '@mdi/js';

  export let boardType

</script>

<div class='toolbar'>
  <div class="left-items">
    {#if boardType === BoardType.Stickies}
      <div class="logo" title="TalkingStickies UI v0.2.2"><TSLogoIcon /></div>
    {:else}
      <div class="logo" title="KanBan UI v0.2.0"><KBLogoIcon /></div><h4 class="logo-text">KanBan</h4>
    {/if}
    <BoardMenu boardType={boardType}></BoardMenu>
  </div>
  <div class="right-items">
    <Folk></Folk>
    <Button icon title="Report a problem in our GitHub repo" on:click={()=>window.open("https://github.com/Holo-Host/talking-stickies/issues", '_blank')}>
      <Icon path={mdiBug} color={"blue"} />
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
  }
  .logo-text {
    padding-bottom: 5px;
    margin-left: 15px;
  }
  .right-items {
    display: flex;
    flex: 0 0 auto;
  }
  .left-items {
    display: flex;
    flex: 0 0 auto;
  }
</style>