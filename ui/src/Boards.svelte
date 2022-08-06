<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import PlusIcon from './icons/PlusIcon.svelte'
  import type { TalkingStickiesStore } from './talkingStickiesStore';

  const dispatch = createEventDispatcher()
 
  const { getStore } = getContext('tsStore');

  const store:TalkingStickiesStore = getStore();
  $: boards = store.boards;
  $: index = store.activeBoardIndex
  const newBoard = () => {
    store.makeBoard()
  }

  const selectBoard = (index:number) => {
      store.setActiveBoard(index)
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
    display: inline;
    margin-right: 5px;
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
</style>

<div class='boards'>
    <div class='top-bar'>
        <div class='add-board' on:click={newBoard}>
            <PlusIcon  />Add Board
        </div>
    </div>
    <div class='board-list'>
        {#each $boards as board, i }
        <div class="board {$index === i ? "selected":""}" on:click={() => selectBoard(i)}>{board.name} </div>
        {/each}
    </div>
</div>