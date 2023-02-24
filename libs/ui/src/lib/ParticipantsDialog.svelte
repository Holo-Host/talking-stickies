<script lang="ts">
  import { encodeHashToBase64 } from '@holochain/client';
  import { Dialog } from 'svelte-materialify';
  import { getContext } from "svelte";
  import type { TalkingStickiesStore } from "./talkingStickiesStore";
  import AvatarIcon from './AvatarIcon.svelte';
  import type { ProfilesStore, Profile} from "@holochain-open-dev/profiles";
  
  export let profilesStore: ProfilesStore|undefined

  const { getStore } :any = getContext('tsStore');
  const store:TalkingStickiesStore = getStore();
  $: participants = store.boardList.participants()
  $: activeFolk = $participants.active


  $: allProfiles = profilesStore ? profilesStore.allProfiles : undefined

  export let active = false;
  export let avatars

  const handleKeydown = (e) => {
    if (e.key === "Escape") {
        active=false
    }
  }
  const getProfile = (folk) : Profile | undefined => {

    if ($allProfiles.status != "complete") {
        return undefined
    }

    if ($allProfiles) {
        const profile = $allProfiles.value.get(folk)
        return profile
    }
    return undefined
  }
</script>
<svelte:window on:keydown={handleKeydown}/>

<Dialog bind:active>
    <div class="participants">
        <div class="dialog-title">Participants Online</div>
        <div class="list">
            {#if profilesStore}
                {#each activeFolk.map(f=>{return {folk:f, profile:getProfile(f)}}) as {folk, profile}}
                    <div class="list-item">
                        <agent-avatar agentPubKey={folk}></agent-avatar>
                        <div style="margin-left:10px; font-size:120%">
                            {profile.nickname}
                        </div>
                    </div>
                {/each}
            {:else}
                {#each activeFolk.map(f=>{return {folk:f, folkB64:encodeHashToBase64(f)}}) as {folk, folkB64}}
                <div class="list-item">
                    <AvatarIcon avatar={avatars[folkB64]} key={folk} size={40} />
                    <div style="margin-left:10px; font-size:120%">
                    {#if avatars[folkB64]}
                        {avatars[folkB64].name}
                    {:else} <i>no-name</i>
                    {/if}
                    </div>
                </div>
                {/each}
            {/if}
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
