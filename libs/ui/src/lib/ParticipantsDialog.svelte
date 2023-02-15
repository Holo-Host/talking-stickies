<script lang="ts">
  import { encodeHashToBase64 } from '@holochain/client';
  import { Dialog } from 'svelte-materialify';
  import { HoloIdenticon } from "@holochain-open-dev/elements";
  import { getContext } from "svelte";
  import type { TalkingStickiesStore } from "./talkingStickiesStore";
  import AvatarIcon from './AvatarIcon.svelte';

  const { getStore } :any = getContext('tsStore');
  const store:TalkingStickiesStore = getStore();
  $: participants = store.boardList.participants()
  $: activeFolk = $participants.active

  if (!customElements.get('holo-identicon')){
      customElements.define('holo-identicon', HoloIdenticon)
  }
  export let active = false;
  export let avatars

  const handleKeydown = (e) => {
    if (e.key === "Escape") {
        active=false
    }
  }

</script>
<svelte:window on:keydown={handleKeydown}/>

<Dialog bind:active>
    <div class="participants">
        <div class="dialog-title">Players Online</div>
            <div class="list">
            {#each activeFolk as folk}
              <div class="list-item">
                <AvatarIcon avatar={avatars[encodeHashToBase64(folk)]} size=40px />
                <div style="margin-left:10px; font-size:120%">
                {#if avatars[encodeHashToBase64(folk)]}
                    {avatars[encodeHashToBase64(folk)].name}
                {:else} <i>no-name</i>
                {/if}
                </div>
            </div>
            {/each}
        </div>
    </div>
</Dialog>

<style>
    .participants {
        margin: 20px;
    }
    .list {
        display: flex;
        flex-direction: column;
    }
    .list-item {
        display: flex;
        align-items: center;
    }
</style>
