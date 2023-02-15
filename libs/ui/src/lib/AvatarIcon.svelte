<script lang="ts">
  import type { Avatar } from "./realmList";
  import { mdiAccount } from '@mdi/js';
  import { Icon } from "svelte-materialify";
  import { HoloIdenticon } from "@holochain-open-dev/elements";
  import { encodeHashToBase64, type AgentPubKey } from "@holochain/client";

  export let border = false
  export let style = undefined
  export let avatar: Avatar = undefined
  export let size:number = 24;
  export let key: AgentPubKey|undefined = undefined
  $: keyB64 = key ? encodeHashToBase64(key) : undefined
  $: cssVarStyles = `--icon-size:${size}px;`;
  $: avatarName =  avatar && avatar.name ? avatar.name : key? `${keyB64.substring(0,8)}...` : "un-named"
  if (!customElements.get('holo-identicon')){
      customElements.define('holo-identicon', HoloIdenticon)
  }
</script>
<div class="wrapper"
    class:bordered={border} style="{cssVarStyles} {style}" title={avatarName}>
    {#if avatar === undefined || avatar.url == ""}
      {#if key}
      <holo-identicon hash={key} size={size}/>
      {:else}
      <Icon path={mdiAccount} size={`${size}px`} />
      {/if}
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