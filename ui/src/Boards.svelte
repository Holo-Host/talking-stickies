<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import PlusIcon from './icons/PlusIcon.svelte'
  import type { TalkingStickiesStore } from './talkingStickiesStore';

  const dispatch = createEventDispatcher()
 
  const { getStore } = getContext('tsStore');

  const store:TalkingStickiesStore = getStore();
  $: boards = store.boards;
 
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
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    padding: 30px 60px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    flex-shrink: 1;
  }
  .board {
    background-color: rgb(208, 226, 193);
    border-radius: 3px;
    padding: 5px 5px;
    display: inline;
    margin-right: 5px;
  }
</style>

<div class='boards'>
    <div class='add-board' on:click={newBoard}>
        <PlusIcon  />Add Board
    </div>
    {#each $boards as board, i }
    <div class="board" on:click={() => selectBoard(i)}>{board.name} </div>
    {/each}
</div>