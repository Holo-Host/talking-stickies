<script lang="ts">
    import { Menu, Button, List, ListItem, Divider, Icon } from 'svelte-materialify';
    import { getContext } from "svelte";
    import type { TalkingStickiesStore } from "./talkingStickiesStore";
    import type { EntryHashB64 } from '@holochain/client';
    import { BoardType } from './board';
    import NewBoardDialog from './NewBoardDialog.svelte';
    import { mdiChevronDown, mdiImport, mdiShapeSquarePlus, mdiArchiveArrowUp } from '@mdi/js';
    import ParticipantsDialog from './ParticipantsDialog.svelte';
  import { get } from 'svelte/store';

    let creating = false
    let showParticipants = false
    export const boardType:BoardType = BoardType.Stickies

    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();
    $: boardList = store.boardList.stateStore()
    $: activeHash = store.boardList.activeBoardHash;
    $: state = store.boardList.getReadableBoardState($activeHash);
    $: participants = store.boardList.participants()
    $: avatars = store.boardList.avatars()

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

{#if showParticipants}
<ParticipantsDialog bind:active={showParticipans} participants={get(participants).active} avatars={$avatars} />
{/if}


{#if creating}
    <NewBoardDialog boardType={boardType} bind:active={creating}></NewBoardDialog>
{/if}