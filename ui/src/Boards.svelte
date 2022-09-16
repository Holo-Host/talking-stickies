<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import { get } from 'svelte/store';
  import PlusIcon from './icons/PlusIcon.svelte'
  import ImportIcon from './icons/ImportIcon.svelte';
  import PencilIcon from './icons/PencilIcon.svelte'
  import UnarchiveIcon from './icons/UnarchiveIcon.svelte'
  import ReloadIcon from './icons/ReloadIcon.svelte'
  import type { TalkingStickiesStore } from './talkingStickiesStore';
  import BoardEditor from './BoardEditor.svelte'
  import { isEqual } from 'lodash'
  import { cloneDeep } from "lodash";
  import { Group, VoteType, DEFAULT_VOTE_TYPES } from './board';

 
  const { getStore } :any = getContext('tsStore');

  const store:TalkingStickiesStore = getStore();
  $: boards = store.boards;
  $: archivedBoards = store.archivedBoards;
  $: index = store.activeBoardIndex

  let editingBoardId
  let editName = ''
  let editGroups = []
  let editVoteTypes = []
  let creating = false
  let loading = false
  const newBoard = () => {
    editVoteTypes = cloneDeep(DEFAULT_VOTE_TYPES)
    creating = true
  }

	let fileinput;
	let showArchived = false

	const onFileSelected = (e)=>{
    let file = e.target.files[0];
    let reader = new FileReader();

    reader.addEventListener("load", async () => {
      const b = JSON.parse(reader.result as string)
      await store.makeBoard(b)
    }, false);
    reader.readAsText(file);
  };

  const addBoard = async (name: string, groups: Group[], voteTypes: VoteType[]) => {
    await store.makeBoard({name, groups, voteTypes})
    creating = false
  }

  const deleteBoard = i => () => {
    store.deleteBoard(i)
    cancelEdit()
  }

  
  const selectBoard = (index:number) => {
      store.setActiveBoard(index)
  }

  const editBoard = (i, name: string, groups: Group[], voteTypes: VoteType[]) => () => {
    editingBoardId = i
    editName = name
    editGroups = cloneDeep(groups)
    editVoteTypes = cloneDeep(voteTypes)
  }

  const updateBoard = i => async (name: string, groups: Group[], voteTypes: VoteType[]) => {
    let changes = []
    if (get($boards[i].name) != name) {
      console.log("updating board name to ",name)
      changes.push(
        {
          type: 'set-name',
          name: name
        })
    }
    if (!isEqual(groups, get($boards[i].workspace.state).groups)) {
      console.log("with groups:", groups)
      changes.push({type: 'set-groups',
         groups: groups
        })
    }
    if (!isEqual(voteTypes, get($boards[i].workspace.state).voteTypes)) {
      console.log("with voteTypes:", voteTypes)
      changes.push({type: 'set-vote-types',
        voteTypes: voteTypes
        })
    }
    if (changes.length > 0) {
      await store.requestBoardChanges(i,changes)
    }
    cancelEdit()
  }
	
  const cancelEdit = () => {
    editingBoardId = null
    editName = ""
    editGroups = []
    editVoteTypes = []
    creating = false
  }

  const reloadBoards = async () => {
    loading = true
    await store.joinExistingWorkspaces()
    loading = false
  }

  const unarchiveBoard = (hash) => {
    store.unarchiveBoard(hash)
  }
</script>

<style>
  .boards {
    display: flex;
    flex-direction: column;
    padding: 30px 60px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
  }
  .board {
    background-color: rgb(204, 204, 204);
    border-radius: 3px;
    padding: 5px 5px;
    display: inherit;
    margin-right: 5px;
    border: 1px solid;
  }
  .board-button {
    margin-left: 5px;
  }
  .selected {
    background-color: rgb(183, 224, 180);
  }
  .archived {
    background-color: rgb(224, 224, 224);
    border: 1px dashed;
  }
  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .board-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    flex-shrink: 1;
  }
  .reload-boards {
    position: absolute;
    right: 45px;
    margin-top: -18px;
    width: 20px;
    height: 20px;
  }
  .top-board-button {
    display: inline-block;
    height: 30px;
    margin-bottom: 10px;
  }

</style>

<div class='boards'>
    <div class='reload-boards' on:click={reloadBoards}>
      <ReloadIcon spinning={loading}/>
    </div>
    <div class='top-bar'>
        <div class='top-board-button' on:click={newBoard} title="New board">
            <PlusIcon  />
        </div>
        <div class='top-board-button' on:click={()=>{fileinput.click();}} title="Import board from JSON file">
          <ImportIcon  />
          <input style="display:none" type="file" accept=".json" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
        </div>
        <div>
          <input type=checkbox bind:checked={showArchived}> Show Archived 
        </div>
    </div>
    <div class='board-list'>
        {#each $boards as board, i }
          {#if editingBoardId === i}
            <BoardEditor handleSave={updateBoard(i)} handleDelete={deleteBoard(i)} {cancelEdit} text={editName} groups={editGroups} voteTypes={editVoteTypes} />
          {:else}
            <div class="board {$index === i ? "selected":""}" on:click={() => selectBoard(i)}>
              {get(board.name)}
              <div class="board-button" on:click={editBoard(i, get(board.name), get(board.workspace.state).groups, get(board.workspace.state).voteTypes)}><PencilIcon /></div>
            </div>
          {/if}
        {/each}
        {#if showArchived}
          {#each Object.entries($archivedBoards) as [hash, board],i }
            <div class="board archived" on:click={unarchiveBoard(hash)}>{board.state.name}<div class="board-button"><UnarchiveIcon /></div></div>
          {/each}
        {/if}
          {#if creating}
        <BoardEditor handleSave={addBoard} {cancelEdit} voteTypes={editVoteTypes} />
        {/if}
    </div>
  </div>