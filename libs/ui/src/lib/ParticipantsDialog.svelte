<script lang="ts">
  import { encodeHashToBase64 } from '@holochain/client';
  import { Dialog, List, ListItem } from 'svelte-materialify';
  import { HoloIdenticon } from "@holochain-open-dev/elements";
  import { getContext, onDestroy, onMount } from "svelte";
  import type { TalkingStickiesStore } from "./talkingStickiesStore";

  const { getStore } :any = getContext('tsStore');
  const store:TalkingStickiesStore = getStore();
  $: participants = store.boardList.participants()
  $: activeFolk = $participants.active

  if (!customElements.get('holo-identicon')){
      customElements.define('holo-identicon', HoloIdenticon)
  }
  export let active = false;
  export let avatars
  onMount( async () => {
      document.addEventListener('keydown', handleKeydown, {
          capture: true
      });

  })
  onDestroy(() => {
    document.removeEventListener('keydown', handleKeydown, {
            capture: true
        });
  })
  const handleKeydown = (e) => {
    if (e.key === "Escape") {
        active=false
    }
  }

</script>

<Dialog bind:active>
    <div class="participants">
        <h5>Participans Online</h5>
        <List>
            {#each activeFolk as folk}
            <ListItem dense={true}>
                <div style="margin-left:10px">
                {#if avatars[encodeHashToBase64(folk)]}
                    {avatars[encodeHashToBase64(folk)].name}
                {:else} <i>no-name</i>
                {/if}
                </div>
                <span slot="prepend">
                    <holo-identicon hash={folk}></holo-identicon>
                </span>
            </ListItem>
            {/each}
        </List>
    </div>
</Dialog>

<style>
    .participants {
        padding: 10px;
    }
</style>
