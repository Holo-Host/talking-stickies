<script lang="ts">
  import { getContext } from "svelte";
  import CardEditor from "./CardEditor.svelte";
  import EmojiIcon from "./icons/EmojiIcon.svelte";
  import { sortBy } from "lodash/fp";
  import type { TalkingStickiesStore } from "./talkingStickiesStore";
  import SortSelector from "./SortSelector.svelte";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { cloneDeep } from "lodash";
  import { Pane } from "./pane";
  import type { v1 as uuidv1 } from "uuid";
  import { type Sticky, BoardType, Group, UngroupedId } from "./board";
  import { mdiCog, mdiExport, mdiPlusCircle } from "@mdi/js";
  import { Icon, Button } from "svelte-materialify";
  import EditBoardDialog from "./EditBoardDialog.svelte";
  import type { Dictionary } from "@holochain-open-dev/core-types";
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

  $: unused = groupCards(items);
  $: avatars = tsStore.boardList.avatars()

  let creatingInColumn: uuidv1 | undefined = undefined;
  let editText = "";
  let editingCardId: uuidv1

  let columns:Dictionary<Group> = {}
  let cardsMap:Dictionary<Sticky> ={}

  const sorted = (itemIds, sortFn)=> {
    var items = itemIds.map((id)=>cardsMap[id])
    if (sortOption) {
      items = sortFn(items) 
    }
    return items
  }

  // TODO refactor into pane?
  const groupCards = (items) => {
    if ($state) {
      columns = {}
      $state.groups.forEach(g => columns[g.id] = cloneDeep(g))
      cardsMap = {} 
      items.forEach(s => cardsMap[s.id] = cloneDeep(s))
    }
  }

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
  let editing = false
  let status = ""
  let dragOn = true
  function handleDragStart(e) {
    console.log("handleDragStart", e)
    status = "Dragging the element " + e
      .target
      .getAttribute('id');
    e.dataTransfer.dropEffect = "move";
    e.dataTransfer
      .setData("text", e.target.getAttribute('id'));
  }

  function handleDragEnd(e) {
    console.log("handleDragEnd",e )
    // if (dropped_in == false) {
    //   status = "You let the " + e
    //     .target
    //     .getAttribute('id') + " go.";
    // }
    // dropped_in = false;
  }
  function handleDragEnter(e) {
        status = "You are dragging over the " + e
            .target
            .getAttribute('id');
    }

  function handleDragLeave(e) {
      status = "You left the " + e
          .target
          .getAttribute('id');
  }
  function handleDragDropColumn(e:DragEvent) {
    e.preventDefault();
    const target = e.target as HTMLElement
    console.log("handleDragDropColumn",e, target )

      var element_id = e
          .dataTransfer
          .getData("text");
      status = "You droped " + element_id + " into colum "+target.id;
  }
</script>

<div class="board">
  DragStatus: {status}
  {#if editing}
    <EditBoardDialog bind:active={editing} boardHash={cloneDeep($activeHash)} boardType={BoardType.KanBan}></EditBoardDialog>
  {/if}
  <div class="top-bar">
    <div class="left-items">
      <h5>{$state.name}</h5>
    </div>
    <div class="right-items">
      <div class="sortby">
        Sort: <SortSelector {setSortOption} {sortOption} />
      </div>
      <Button size=small icon on:click={()=>editing=true} title="Settings">
        <Icon path={mdiCog} />
      </Button>
      <Button size=small icon on:click={() => pane.exportBoard($state)} title="Export Board">
        <Icon path={mdiExport} />
      </Button>
    </div>
  </div>
  {#if $state}
    <div class="columns">
      {#each Object.entries($state.grouping).filter(([columnId, _])=> columnId!=UngroupedId) as [columnId, cardIds]}
        <div class="column">
          <div class="column-item column-title">
            <div>{columns[columnId].name}</div>
          </div>
          <div class="cards"
            on:dragenter={handleDragEnter} 
            on:dragleave={handleDragLeave}  
            on:drop={handleDragDropColumn}
            on:dragover={()=>false}
          >
          {#each sorted(cardIds, sortCards) as { id:cardId, text, votes, props }}
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
                  groups={$state.groups}
                  props={props}
                  avatars={avatars}
                />
              {:else}
                <div 
                  class="card"
                  id={cardId}
                  on:dragenter={handleDragEnter} 
                  on:dragleave={handleDragLeave}  
                  on:dragover={()=>false}
                  draggable={dragOn}
                  on:dragstart={handleDragStart}
                  on:dragend={handleDragEnd}              


                  on:click={editCard(cardId, text)} 
                  style:background-color={props && props["color"] ? props["color"] : "white"}
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
          {/each}
          </div>
          {#if creatingInColumn !==undefined  && creatingInColumn == columnId}
          <div class="new-card">
            <CardEditor handleSave={createCard} {cancelEdit} groups={$state.groups} avatars={avatars}/>
          </div>
          {:else}
          <div class="column-item column-footer">
            <div>Add Card</div>
            <Button icon on:click={newCard(columnId)}>
              <Icon path={mdiPlusCircle}/>
            </Button>
          </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .board {
    display: flex;
    flex-direction: column;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    margin-left: 15px;
    margin-right: 15px;
    margin-top: 15px;
  }
  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: white;
    border-bottom: 2px solid #bbb;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 3px 3px 0 0;
  }
  .left-items {
    display: flex;
    align-items: center;
  }
  .right-items {
    display: flex;
    align-items: center;
  }
  .sortby {
    border-right: 1px solid lightgray;
    display: flex;
    align-items: center;
    margin-right: 8px;
    height: 47px;
  }
  .columns {
    display: flex;
    flex: 0 1 auto;
    max-height: 100%;
  }
  .column-item {
    padding: 10px 5px 0px 5px;
    display: flex;
    align-items: center;
    flex: 0 1 auto;
  }
  .column-title {
    border-bottom: 1px solid gray;
    font-weight: bold;
  }
  .column-footer {
    border-top: 1px solid gray;
  }
  .column {
    display: flex;
    flex-direction: column;
    background-color: #d6d7d7;
    width: 300px;
    margin: 5px;
    border-radius: 5px;
    min-width: 130px;
  }
  .cards {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
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
    overflow-y: auto;
    max-height: 200px;
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
