<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import { get } from 'svelte/store';
  import PlusIcon from './icons/PlusIcon.svelte'
  import PencilIcon from './icons/PencilIcon.svelte'
  import ReloadIcon from './icons/ReloadIcon.svelte'
  import type { TalkingStickiesStore } from './talkingStickiesStore';
  import BoardEditor from './BoardEditor.svelte'

  const dispatch = createEventDispatcher()
 
  const { getStore } = getContext('tsStore');

  const store:TalkingStickiesStore = getStore();
  $: boards = store.boards;
  $: index = store.activeBoardIndex

  let editingBoardId
  let editName = ''
  let creating = false

  const newBoard = () => {
    creating = true
  }

  const addBoard = async (name: string) => {
    await store.makeBoard(name)
    creating = false
  }

  const deleteBoard = i => () => {
    store.deleteBoard(i)
    cancelEdit()
  }

  
  const selectBoard = (index:number) => {
      store.setActiveBoard(index)
  }

  const editBoard = (i, name) => () => {
    editingBoardId = i
    editName = name
  }


  const updateBoard = i => async name => {
    await store.requestBoardChanges(i,
    [
      {type: 'set-name',
       name: name
      }
    ])
    cancelEdit()
  }

  const cancelEdit = () => {
    editingBoardId = null
    editName = ""
    creating = false
  }

  const reloadBoards = () => {
    store.joinExistingSessions()
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
    justify-content: flex-start;
    flex-shrink: 1;
  }
  .relcoad-boards {
    position: absolute;
    right: 45px;
    margin-top: -18px;
    }

</style>

<div class='boards'>
    <div class='relcoad-boards' on:click={reloadBoards}>
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
            <BoardEditor handleSave={updateBoard(i)} handleDelete={deleteBoard(i)} {cancelEdit} text={editName} />
          {:else}
            <div class="board {$index === i ? "selected":""}" on:click={() => selectBoard(i)}>{get(board.name)} <div class="pencil" on:click={editBoard(i, get(board.name))}><PencilIcon  /></div></div>
            
          {/if}
        {/each}
        {#if creating}
        <BoardEditor handleSave={addBoard} {cancelEdit} />
        {/if}
    </div>
</div>