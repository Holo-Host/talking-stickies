<script type="ts">
  import { BoardType } from "./board";
  import TSLogoIcon from "./icons/TSLogoIcon.svelte";
  import KBLogoIcon from "./icons/KBLogoIcon.svelte";
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
    <div class="logo" title="TalkingStickies UI v0.1.2"><TSLogoIcon /></div><h1 class="logo-text">TalkingStickies</h1>
  {:else}
    <div class="logo" title="KanBan UI v0.1.2"><KBLogoIcon /></div><h1 class="logo-text">KanBan</h1>
  {/if}
</div>
