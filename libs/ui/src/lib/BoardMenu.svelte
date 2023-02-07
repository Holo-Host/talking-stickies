<script lang="ts">
    import { Menu, Button, List, ListItem, Icon } from 'svelte-materialify';
    import { getContext } from "svelte";
    import type { TalkingStickiesStore } from "./talkingStickiesStore";
    import type { EntryHashB64 } from '@holochain/client';
    import type { BoardType } from './board';
    import NewBoardDialog from './NewBoardDialog.svelte';
    import { mdiChevronDown, mdiImport, mdiShapeSquarePlus, mdiArchiveArrowUp } from '@mdi/js';


    let creating = false

    export let boardType: BoardType

    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();
    $: boardList = store.boardList.stateStore()
    $: activeHash = store.boardList.activeBoardHash;
    $: state = store.boardList.getReadableBoardState($activeHash);
    $: archivedBoards = $boardList.boards.findIndex((board)=>board.status === "archived") >= 0
    $: activeBoards = $boardList.boards.findIndex((board)=>board.status !== "archived") >= 0

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

<div class="board-menu">
<input style="display:none" type="file" accept=".json" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
<Button icon on:click={()=>creating = true} style="margin-left:10px" title="New Board"><Icon path={mdiShapeSquarePlus} /></Button>
<Button icon on:click={()=>{fileinput.click();}} title="Import Board"><Icon path={mdiImport} /></Button>
{#if activeBoards}
<Menu>
    <div slot="activator">
        <Button style="margin-left:10px">
            {#if $activeHash}
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
    </List>
</Menu>
{/if}
{#if archivedBoards}
<Menu>
    <div slot="activator">
        <Button style="margin-left:10px" title="Archived Boards">
            <Icon path={mdiArchiveArrowUp}></Icon>
            <Icon path={mdiChevronDown}></Icon>
        </Button>
    </div>
    <List>
        {#each $boardList.boards as board }
            {#if board.status === "archived" }
                <ListItem dense={true} on:click={unarchiveBoard(board.hash)}>{board.name}</ListItem>
            {/if}
        {/each}
    </List>
</Menu>
{/if}

{#if creating}
    <NewBoardDialog boardType={boardType} bind:active={creating}></NewBoardDialog>
{/if}
</div>
<style>
  .board-menu {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
  }

</style>