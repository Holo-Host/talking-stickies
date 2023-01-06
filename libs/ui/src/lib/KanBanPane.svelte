<script lang="ts">
  import { getContext } from "svelte";
  import CardEditor from "./CardEditor.svelte";
  import PlusIcon from "./icons/PlusIcon.svelte";
  import ExIcon from "./icons/ExIcon.svelte";
  import ExportIcon from "./icons/ExportIcon.svelte";
  import EmojiIcon from "./icons/EmojiIcon.svelte";
  import { sortBy } from "lodash/fp";
  import type { TalkingStickiesStore } from "./talkingStickiesStore";
  import SortSelector from "./SortSelector.svelte";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { cloneDeep } from "lodash";
  import { Pane } from "./pane";
  import type { v1 as uuidv1 } from "uuid";
  import type { Sticky } from "./board";

  const pane = new Pane();

  Marked.setOptions
  ({
    renderer: new Renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false
  });

  $: sortOption = null;

  function setSortOption(newSortOption) {
    sortOption = newSortOption;
  }

  const { getStore } :any = getContext("tsStore");
  let tsStore: TalkingStickiesStore = getStore();

  $: activeHash = tsStore.boardList.activeBoardHash;
  $: state = tsStore.boardList.getReadableBoardState($activeHash);
  $: items = $state ? $state.stickies : undefined;
  $: sortCards = sortOption
    ? sortBy((sticky: Sticky) => countVotes(sticky.votes, sortOption) * -1)
    : (items) => items;

  $: sortedCards = sortCards(items);
  $: groupedCards = groupCards(sortedCards);
  $: avatars = tsStore.boardList.avatars()

  let creatingInColumn: uuidv1 | undefined = undefined;
  let editText = "";
  let editingCardId: uuidv1

  let columnIds = []
  let columns = []

  const countCards = (items) : {} => {
    let counts = {}
    items.forEach((card) => {
      counts[card.group] = counts[card.group] != undefined ? counts[card.group]+1 : 0
    })
    return counts
  }
    
  const groupCards = (items) => {
    if ($state) {
      columns = cloneDeep($state.groups);
      columnIds = columns.map(c => c.id)
    }
  };

  const newCard = (group: uuidv1) => () => {
      creatingInColumn = group;
  };
  
  const createCard = (text:string, _groupId: uuidv1, props:any) => {
    pane.addSticky(text, creatingInColumn, props)
    creatingInColumn = undefined
  }

  const clearEdit = () => {
    editingCardId = null;
    editText = "";
  };

  const cancelEdit = () => {
    creatingInColumn = undefined;
    clearEdit();
  }
  
  const editCard = (id: uuidv1, text: string) => () => {
    editingCardId = id;
    editText = text;
  };

  const countVotes = (votes, type) => {
    if (typeof votes[type] === 'undefined') {
      return []
    }
    const agentKeys = Object.keys(votes[type]);
    return agentKeys.reduce(
      (total, agentKey) => total + (votes[type][agentKey] || 0),
      0
    );
  };

  const myVotes = (votes, type) => {
    if (typeof votes[type] === 'undefined') {
      return 0
    }
    return votes[type][tsStore.myAgentPubKey()] || 0;
  };

  const closeBoard = () => {
    tsStore.boardList.closeActiveBoard();
  };

</script>

<div class="board">
  <div class="close-board global-board-button" on:click={closeBoard} title="Close Board">
    <ExIcon />
  </div>
  <div class="export-board global-board-button" on:click={() => pane.exportBoard($state)} title="Export Board">
    <ExportIcon />
  </div>
  <div class="top-bar">
    <h1>{$state.name}</h1>
    <SortSelector {setSortOption} {sortOption} />
  </div>
  {#if $state}
    <div class="columns">
      {#each columns as column}
        <div class="column">
          <div class="column-title">
            <div>{column.name}</div>
            <div class="add-card" on:click={newCard(column.id)}>
              <PlusIcon />
            </div>
          </div>
          {#if creatingInColumn !==undefined && column.id === creatingInColumn}
          <div class="new-card">
            <CardEditor handleSave={createCard} {cancelEdit} groups={columns} avatars={avatars}/>
          </div>
          {/if}
          <div class="cards">
          {#each sortedCards as { id:cardId, text, votes, group:columnId, props }}
            {#if column.id === columnId}
              {#if editingCardId === cardId}
                <CardEditor
                  handleSave={
                    pane.updateSticky(items, cardId, clearEdit)
                  }
                  handleDelete={
                    pane.deleteSticky(cardId, clearEdit)
                  }
                  {cancelEdit}
                  text={editText}
                  groupId={columnId}
                  groups={columns}
                  props={props}
                  avatars={avatars}
                />
              {:else}
                <div class="card" on:click={editCard(cardId, text)} 
                  style:background-color={props && props.color ? props.color : "white"}
                  >
                  <div class="card-content">
                    {@html Marked.parse(text)}
                  </div>
                  {#if props && props.agents && props.agents.length > 0}
                    Tagged: 
                    {#each props.agents as agent}
                      <span class="avatar-name" title={agent}>{$avatars[agent] ? $avatars[agent].name : `${agent.substring(0,8)}...`}</span>
                    {/each}
                  {/if}
                  <div class="votes">
                    {#each $state.voteTypes as {type, emoji, toolTip, maxVotes}}
                      <div
                        class="vote"
                        title={toolTip}
                        class:voted={myVotes(votes, type) > 0}
                        on:click|stopPropagation={() => pane.voteOnSticky(tsStore.myAgentPubKey(), items, cardId, type, maxVotes)}
                      >
                        <EmojiIcon emoji={emoji} class="vote-icon" />
                        {countVotes(votes, type)}
                        <div class="vote-counts">
                          {#each new Array(myVotes(votes, type)).map((_, i) => i) as index}
                            <div class="vote-count" />
                          {/each}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
              {/if}
            {/if}
          {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .board {
    display: flex;
    flex-direction: column;
    padding: 30px 60px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
  }
  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .global-board-button {
    position: absolute;
    margin-top: -18px;
    cursor: pointer;
  }
  .close-board {
    right: 45px;
  }
  .export-board {
    right: 70px;
  }
  .add-card {
    display: inline-block;
    margin-left: 7px;
  }
  .columns {
    display: flex;
    flex-wrap: wrap;
    flex: 0 1 auto;
  }
  .column-title {
    padding: 10px 5px 0px 5px;
    display: flex;
    align-items: center;
    flex: 0 1 auto;
  }
  .column {
    display: block;
    background-color: #d6d7d7;
    width: 300px;
    margin: 5px;
    border-radius: 5px;
  }
  .cards {
    display: flex;
    flex-direction: column;
    overflow: scroll;
    flex: 1 1 auto;
  }
  .card {
    background-color: white;
    margin: 10px;
    padding: 5px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    overflow: hidden;
  }
  .card-content {
    overflow-y: scroll;
  }
  .add-card :global(svg) {
    margin-right: 6px;
    height: 30px;
    width: 30px;
  }
  .votes {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin-top: auto;
  }
  .vote {
    display: flex;
    align-items: center;
    background: white;
    border-radius: 5px;
    flex-basis: 26px;
    height: 25px;
    padding: 0 5px;
    border: 1px solid white;
    position: relative;
    cursor: pointer;
  }
  .voted {
    border-color: black;
  }
  .vote-counts {
    padding-top: 2px;
    display: flex;
    flex-direction: column;
    position: absolute;
    left: -3px;
    justify-content: flex-start;
  }
  .vote-count {
    border-radius: 50px;
    width: 5px;
    height: 5px;
    background-color: black;
    margin-bottom: 2px;
  }
  .avatar-name {
    border-radius: 5px;
    background-color: rgb(13, 145, 147);
    color: white;
    padding: 0 3px;
    margin-right: 4px;
  }
</style>
