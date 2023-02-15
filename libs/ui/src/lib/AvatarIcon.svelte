<script lang="ts">
  import type { Avatar } from "./realmList";
  import { mdiAccount } from '@mdi/js';
  import { Icon } from "svelte-materialify";

  export let border = false
  export let style = undefined
  export let avatar: Avatar = undefined
  export let size = "24px";
  $: cssVarStyles = `--icon-size:${size};`;

</script>
<div class="wrapper"
    class:bordered={border} style="{cssVarStyles} {style}" title={avatar ? avatar.name : ""}>
    {#if avatar === undefined || avatar.url == ""}
    <Icon path={mdiAccount} size={size} />
    {:else}
    <img src={avatar.url} />
    {/if}
</div>
<style>
  .bordered {
    border: solid 1px gray;
  }
  .wrapper {
    border-radius: 50%;
    display: flex;
  }
  img {
    width: var(--icon-size, 24px);
    height: var(--icon-size, 24px);
    border-radius: 50%;
  }
</style>