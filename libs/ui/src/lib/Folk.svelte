<script lang="ts">
    import { Button, Icon } from 'svelte-materialify';
    import { mdiAccountGroup } from '@mdi/js';
    import ParticipantsDialog from './ParticipantsDialog.svelte';
    import type { Avatar } from './boardList';
    import AvatarDialog from './AvatarDialog.svelte';
    import { getContext, onMount } from "svelte";
    import type { TalkingStickiesStore } from "./talkingStickiesStore";
    import { cloneDeep } from "lodash";
    import AvatarIcon from './AvatarIcon.svelte';
    import type { ProfilesStore } from "@holochain-open-dev/profiles";
    import { get } from 'svelte/store';    
    
    const { getStore } :any = getContext('tsStore');
    const store:TalkingStickiesStore = getStore();
    const myAgentPubKey = store.myAgentPubKey()
    $: avatars = store.boardList.avatars()
    //@ts-ignore
    $: myProfile = profilesStore ? get(profilesStore.myProfile).value : undefined
    $: myName =  myProfile ? myProfile.nickname : $avatars[myAgentPubKey]? $avatars[myAgentPubKey].name : ""
    $: myAvatar = $avatars[myAgentPubKey]? $avatars[myAgentPubKey] : undefined
    $: participants = store.boardList.participants()
    let showParticipants = false
    let editingAvatar = false
    let avatar: Avatar = {name:"", url:""}
    export let profilesStore: ProfilesStore|undefined

    onMount(async () => {
        if (!myName) {
            editingAvatar = true
        }
	});

    const editAvatar = () => {
        const myAvatar = $avatars[store.myAgentPubKey()]
        if (myAvatar) {
        avatar = myAvatar
        }
        editingAvatar = true
    }
    const setAvatar = (avatar: Avatar) => {
        store.boardList.requestChanges([{type:'set-avatar', pubKey:store.myAgentPubKey(), avatar:cloneDeep(avatar)}])
        editingAvatar = false
    }

</script>
<Button icon on:click={()=>{showParticipants=true}} style="margin-left:10px" title="Show Participants"><Icon path={mdiAccountGroup} />{$participants.active.length }</Button>
{#if !profilesStore}
<Button icon on:click={editAvatar} title={myName ? myName:"Edit Avatar"} style="margin-left:10px"><AvatarIcon avatar={myAvatar} border={false}></AvatarIcon></Button>
{/if}

{#if showParticipants}
<ParticipantsDialog bind:active={showParticipants} avatars={$avatars} profilesStore={profilesStore}/>
{/if}

{#if editingAvatar}
<AvatarDialog handleSave={setAvatar} bind:active={editingAvatar} avatar={avatar} />
{/if}