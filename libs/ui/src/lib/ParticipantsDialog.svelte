<script lang="ts">
  import { encodeHashToBase64 } from '@holochain/client';
  import { Dialog, List, ListItem } from 'svelte-materialify';
  import { HoloIdenticon } from "@holochain-open-dev/elements";

  if (!customElements.get('holo-identicon')){
      customElements.define('holo-identicon', HoloIdenticon)
    }
    export let active = false;
    export let participants 
    export let avatars

</script>

<Dialog bind:active>
    <List>
        {#each participants as folk}
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
</Dialog>
