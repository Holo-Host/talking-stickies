<script lang="ts">
    import { Menu, Button, List, ListItem, Icon } from 'svelte-materialify';
    import { getContext } from "svelte";
    import type { TalkingStickiesStore } from "./talkingStickiesStore";
    import type { EntryHashB64 } from '@holochain/client';
    import { BoardType } from './board';
    import NewBoardDialog from './NewBoardDialog.svelte';
    import { mdiChevronDown, mdiImport, mdiShapeSquarePlus, mdiArchiveArrowUp, mdiAccountGroup, mdiAccount } from '@mdi/js';
    import ParticipantsDialog from './ParticipantsDialog.svelte';
    import { get } from 'svelte/store';
    import type { Avatar } from './boardList';
    import AvatarDialog from './AvatarDialog.svelte';
    import { cloneDeep } from "lodash";


    let creating = false
    let showParticipants = false
    let editingAvatar = false
    let avatar: Avatar = {name:"", url:""}

    export let boardType

    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();
    const myAgentPubKey = store.myAgentPubKey()
    $: boardList = store.boardList.stateStore()
    $: activeHash = store.boardList.activeBoardHash;
    $: state = store.boardList.getReadableBoardState($activeHash);
    $: participants = store.boardList.participants()
    $: avatars = store.boardList.avatars()
    $: myName = $avatars[myAgentPubKey]? $avatars[myAgentPubKey].name : ""

    const selectBoard = (hash: EntryHashB64) => {
        store.boardList.setActiveBoard(hash)
    }

    let fileinput;
	const onFileSelected = (e)=>{
        let file = e.target.files[0];
        let reader = new FileReader();

        reader.addEventListener("load", async () => {
        const b = JSON.parse(reader.result as string)
        const board = await store.boardList.makeBoard(b)
        selectBoard(board.hashB64())
        }, false);
        reader.readAsText(file);
    };
    const unarchiveBoard = (hash: EntryHashB64) => () => {
        store.boardList.unarchiveBoard(hash)
    }

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

<input style="display:none" type="file" accept=".json" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
{#if $boardList.boards.length > 0}
<Menu>
    <div slot="activator">
        <Button style="margin-left:10px">
            {#if $state}
                {$state.name}
            {:else}
                <i>Select Board</i>
            {/if}
            <Icon path={mdiChevronDown}></Icon>
        </Button>
    </div>
    <List>
        {#each $boardList.boards as board }
            {#if board.status !== "archived" }
                <ListItem dense={true} on:click={()=>selectBoard(board.hash)}>{board.name}</ListItem>
            {/if}
        {/each}
        {#each $boardList.boards as board }
            {#if board.status === "archived" }
                <ListItem dense={true} on:click={unarchiveBoard(board.hash)}>{board.name}<Icon path={mdiArchiveArrowUp}/></ListItem>
            {/if}
        {/each}
    </List>
</Menu>
{/if}
<Button icon on:click={()=>creating = true} style="margin-left:10px" title="New Board"><Icon path={mdiShapeSquarePlus} /></Button>
<Button icon on:click={()=>{fileinput.click();}} style="margin-left:10px" title="Import Board"><Icon path={mdiImport} /></Button>
<Button icon on:click={()=>{showParticipants=true}} style="margin-left:10px" title="Show Participants"><Icon path={mdiAccountGroup} />{$participants.active.length }</Button>
<Button icon on:click={editAvatar} title={myName ? myName:"Edit Avatar"} style="margin-left:10px"><Icon path={mdiAccount} /></Button>

{#if showParticipants}
<ParticipantsDialog bind:active={showParticipants} participants={get(participants).active} avatars={$avatars} />
{/if}

{#if editingAvatar}
<AvatarDialog handleSave={setAvatar} bind:active={editingAvatar} avatar={avatar} />
{/if}

{#if creating}
    <NewBoardDialog boardType={boardType} bind:active={creating}></NewBoardDialog>
{/if}