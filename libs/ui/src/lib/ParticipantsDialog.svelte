<script lang="ts">
  import { encodeHashToBase64 } from '@holochain/client';
  import { Dialog, List, ListItem } from 'svelte-materialify';
  import { HoloIdenticon } from "@holochain-open-dev/elements";
  import { getContext } from "svelte";
  import type { TalkingStickiesStore } from "./talkingStickiesStore";
  import { get } from 'svelte/store';

  const { getStore } :any = getContext('tsStore');
  const store:TalkingStickiesStore = getStore();
  $: participants = store.boardList.participants()
  $: activeFolk = $participants.active

  if (!customElements.get('holo-identicon')){
      customElements.define('holo-identicon', HoloIdenticon)
    }
    export let active = false;
    export let avatars

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
