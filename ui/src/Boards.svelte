<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import { get } from 'svelte/store';
  import PlusIcon from './icons/PlusIcon.svelte'
  import PencilIcon from './icons/PencilIcon.svelte'
  import ReloadIcon from './icons/ReloadIcon.svelte'
  import type { TalkingStickiesStore } from './talkingStickiesStore';
  import BoardEditor from './BoardEditor.svelte'
  import { isEqual } from 'lodash'
  import { cloneDeep } from "lodash";
import type { Group } from './board';

  const dispatch = createEventDispatcher()
 
  const { getStore } = getContext('tsStore');

  const store:TalkingStickiesStore = getStore();
  $: boards = store.boards;
  $: index = store.activeBoardIndex

  let editingBoardId
  let editName = ''
  let editGroups = []
  let creating = false

  const newBoard = () => {
    creating = true
  }

  const addBoard = async (name: string, groups: Group[]) => {
    await store.makeBoard({name, groups})
    creating = false
  }

  const deleteBoard = i => () => {
    store.deleteBoard(i)
    cancelEdit()
  }

  
  const selectBoard = (index:number) => {
      store.setActiveBoard(index)
  }

  const editBoard = (i, name, groups) => () => {
    editingBoardId = i
    editName = name
    editGroups = cloneDeep(groups)
  }

  const updateBoard = i => async (name, groups) => {
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
    if (changes.length > 0) {
      await store.requestBoardChanges(i,changes)
    }
    cancelEdit()
  }

  const cancelEdit = () => {
    editingBoardId = null
    editName = ""
    editGroups = []
    creating = false
  }

  const reloadBoards = () => {
    store.joinExistingWorkspaces()
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
  }
  .pencil {
    margin-left: 5px;
  }
  .selected {
    background-color: rgb(183, 224, 180);
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
  }
  .add-board {
    display: inline-block;
    height: 30px;
    margin-bottom: 10px;
  }

</style>

<div class='boards'>
    <div class='reload-boards' on:click={reloadBoards}>
      <ReloadIcon  />
    </div>
    <div class='top-bar'>
        <div class='add-board' on:click={newBoard}>
            <PlusIcon  />Add Board
        </div>
    </div>
    <div class='board-list'>
        {#each $boards as board, i }
          {#if editingBoardId === i}
            <BoardEditor handleSave={updateBoard(i)} handleDelete={deleteBoard(i)} {cancelEdit} text={editName} groups={editGroups} />
          {:else}
            <div class="board {$index === i ? "selected":""}" on:click={() => selectBoard(i)}>{get(board.name)} <div class="pencil" on:click={editBoard(i, get(board.name), get(board.workspace.state).groups)}><PencilIcon  />
            </div>
           

          </div>
            
          {/if}
        {/each}
        {#if creating}
        <BoardEditor handleSave={addBoard} {cancelEdit} />
        {/if}
    </div>
</div>