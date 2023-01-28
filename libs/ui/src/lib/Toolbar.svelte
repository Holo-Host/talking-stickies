<script lang="ts">
  import { BoardType } from "./board";
  import TSLogoIcon from "./icons/TSLogoIcon.svelte";
  import KBLogoIcon from "./icons/KBLogoIcon.svelte";
  import BoardMenu from "./BoardMenu.svelte";

  export let boardType : BoardType = BoardType.Stickies

</script>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    height: 70px;
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
</style>

<div class='toolbar'>
  {#if boardType === BoardType.Stickies}
    <div class="logo" title="TalkingStickies UI v0.2.0"><TSLogoIcon /></div><h4 class="logo-text">TalkingStickies</h4>
  {:else}
    <div class="logo" title="KanBan UI v0.2.0"><KBLogoIcon /></div><h4 class="logo-text">KanBan</h4>
  {/if}
  <BoardMenu></BoardMenu>
</div>
