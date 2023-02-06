<script lang="ts">
  import { getContext } from "svelte";
  import StickyEditor from "./StickyEditor.svelte";
  import EmojiIcon from "./icons/EmojiIcon.svelte";
  import type { v1 as uuidv1 } from "uuid";
  import { sortBy } from "lodash/fp";
  import type { TalkingStickiesStore } from "./talkingStickiesStore";
  import SortSelector from "./SortSelector.svelte";
  import { Marked, Renderer } from "@ts-stack/markdown";
  import { cloneDeep } from "lodash";
  import { Pane } from "./pane";
  import { BoardType, Group, UngroupedId, type Sticky } from "./board";
  import { mdiCloseBoxOutline, mdiCog, mdiExport, mdiNotePlusOutline } from '@mdi/js';
  import { Button, Icon } from "svelte-materialify"
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
  $: stickies = $state ? $state.stickies : undefined;
  $: sortStickies = sortOption
    ? sortBy((sticky) => countVotes(sticky.votes, sortOption) * -1)
    : (stickies) => stickies;

  $: unused = groupStickies(stickies);

  let creatingInGroup: uuidv1 | undefined = undefined;
  let editText = "";
  let editingStickyId: uuidv1

  let groups:Dictionary<Group> = {}
  let stickiesMap:Dictionary<Sticky> ={}

  const sorted = (itemIds, sortFn)=> {
    var items = itemIds.map((id)=>stickiesMap[id])
    if (sortOption) {
      items = sortFn(items) 
    }
    return items
  }
    
  // TODO refactor into pane?
  const groupStickies = (stickies) => {
    if ($state) {
      groups = {}
      $state.groups.forEach(g => groups[g.id] = cloneDeep(g))
      stickiesMap = {} 
      stickies.forEach(s => stickiesMap[s.id] = cloneDeep(s))
    }
  };

  const newSticky = (group: uuidv1) => () => {
      creatingInGroup = group;
  };
  
  const createSticky = (text: string, _groupId: uuidv1, props) => {
    pane.addSticky(text, creatingInGroup, props)
    creatingInGroup = undefined
  }

  const clearEdit = () => {
    editingStickyId = null;
    editText = "";
  };

  const cancelEdit = () => {
    creatingInGroup = undefined;
    clearEdit();
  }
  
  const editSticky = (id:uuidv1, text: string) => () => {
    editingStickyId = id;
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
  const groupWidth = (groupId) : string => {
    const len = Object.keys($state.grouping).length // > 0 ? (stickesCounts[UngroupedId] > 0 ? $state.groups.length : $state.groups.length - 1) : 1
    // TODO: maybe set width dynamically by number of cards in group...
    if (len <= 4) {
      return 100/len+"%"
    }
    if (len == 5) {
      return "33%"
    }
    if (len == 6) {
      return "33%"
    }
    if (len == 7) {
      return "25%"
    }
    if (len == 8) {
      return "25%"
    }
    if (len == 9) {
      return "33%"
    }
    if (len == 10) {
      return "25%"
    }
    return 'fit-content'
  }
  let editing = false
  let draggingHandled = true
  let draggedItemId = ""
  let dragOn = true
  let dragTarget = ""
  function handleDragStart(e) {
    draggingHandled = false
    //console.log("handleDragStart", e)
    e.dataTransfer.dropEffect = "move";
    draggedItemId = e.target.getAttribute('id')
    e.dataTransfer
      .setData("text", e.target.getAttribute('id'));
  }
  function handleDragEnd(e) {
    clearDrag()
    //console.log("handleDragEnd",e )
  }

  const findDropParentElement = (element: HTMLElement):HTMLElement => {
    while (element && !(element.classList.contains("sticky") || element.classList.contains("group"))) {
      element = element.parentElement
    }
    return element
  }
  const findDropGroupParentElement = (element: HTMLElement):HTMLElement => {
    while (element && !element.classList.contains("group")) {
      element = element.parentElement
    }
    return element
  }
  const findDropCardParentElement = (element: HTMLElement):HTMLElement => {
    while (element && !element.classList.contains("sticky")) {
      element = element.parentElement
    }
    return element
  }

  function handleDragEnter(e) {
    const elem = findDropParentElement(e.target as HTMLElement)
    dragTarget = elem ? elem.id : ""
  }

  function handleDragLeave(e) {
    const target = e.target as HTMLElement
    if (target.id == dragTarget) {
      dragTarget = ""
    }
  }

  function handleDragOver(e) {
    e.preventDefault()
  }
  function handleDragDropGroup(e:DragEvent) {
    e.preventDefault();
    if (draggingHandled) {
      //console.log("ignoring because it was handled")
      return
    }
    const target = findDropGroupParentElement(e.target as HTMLElement)
    var srcId = e.dataTransfer.getData("text");
    if (target.id) {
      pane.dispatch("requestChange",[{ type: "update-sticky-group", id:srcId, group:target.id  }])
    }
    clearDrag()
    //console.log("handleDragDropGroup",e, target )
  }
  function handleDragDropCard(e:DragEvent) {
    e.preventDefault();
    const target = findDropCardParentElement(e.target as HTMLElement)
    //console.log("handleDragDropCard",e, target )
    var srcId = e.dataTransfer.getData("text");
    if (target.id && (srcId != target.id) && confirm("Merge stickies?")) {
      pane.dispatch("requestChange",[{ type: "merge-stickies", dstId: target.id, srcId }])
    }
    clearDrag()
  }
  const clearDrag = () => {
    draggingHandled = true
    draggedItemId = ""
    dragTarget = ""
  }
  let dragDuration = 300
</script>

<div class="board">
  {#if editing}
    <EditBoardDialog bind:active={editing} boardHash={cloneDeep($activeHash)} boardType={BoardType.Stickies}></EditBoardDialog>
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
      <Button size=small icon on:click={() => pane.exportBoard(BoardType.Stickies, $state)} title="Export">
        <Icon path={mdiExport} />
      </Button>
      <Button size=small icon on:click={closeBoard} title="Close">
        <Icon path={mdiCloseBoxOutline} />
      </Button>
    </div>
  </div>
  {#if $state}
  <div class="groups">
      {#each $state.groups.map((group)=> [group.id, $state.grouping[group.id]]) as [groupId, stickyIds]}
        {#if (groupId !== UngroupedId || stickyIds.length > 0 || $state.groups.length == 1)}
        <div class="group" style:width={groupWidth(groupId)}
        class:glowing={dragTarget == groupId}
        id={groupId}
        on:dragenter={handleDragEnter} 
        on:dragleave={handleDragLeave}  
        on:drop={handleDragDropGroup}
        on:dragover={handleDragOver}
      >
          <div class="group-title">
            {#if $state.groups.length > 1}  
              <b>{#if groupId === UngroupedId}Ungrouped{:else}{groups[groupId].name}{/if}</b>
            {/if}
            <Button size=small icon on:click={newSticky(groupId)} title="New Sticky">
                <Icon path={mdiNotePlusOutline} />
            </Button>
          </div>
          <div class="stickies"
            >
          {#each sorted(stickyIds, sortStickies) as { id, text, votes, props } (id)}
            {#if editingStickyId === id}
              <StickyEditor
                handleSave={
                  pane.updateSticky(stickies, id, clearEdit)
                }
                handleDelete={
                  pane.deleteSticky(id, clearEdit)
                }
                {cancelEdit}
                text={editText}
                groupId={groupId}
                props={props}
              />
            {:else}
              <div 
                class="sticky"
                class:tilted={draggedItemId == id}
                class:glowing={dragTarget == id}
                id={id}
                on:dragenter={handleDragEnter} 
                on:dragover={handleDragOver}
                on:dragleave={handleDragLeave}  
                on:drop={handleDragDropCard}
                draggable={dragOn}
                on:dragstart={handleDragStart}
                on:dragend={handleDragEnd}              

                on:click={editSticky(id, text)} 
                style:background-color={props && props.color ? props.color : "#d4f3ee"}
                >
                <div class="sticky-content">
                  {@html Marked.parse(text)}
                </div>
                <div class="votes">
                  {#each $state.voteTypes as {type, emoji, toolTip, maxVotes}}
                    <div
                      class="vote"
                      title={toolTip}
                      class:voted={myVotes(votes, type) > 0}
                      on:click|stopPropagation={() => pane.voteOnSticky(tsStore.myAgentPubKey(), stickies, id, type, maxVotes)}
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
          {#if creatingInGroup !== undefined  && creatingInGroup == groupId}
            <StickyEditor handleSave={createSticky} {cancelEdit} />
          {/if}
          </div>
        </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .board {
    display: flex;
    flex-direction: column;
    min-height: 500px;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    background-color: #f0f0f0;
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
  .groups {
    display: flex;
    flex-wrap: wrap;
    padding: 5px;
  }
  .group {
    display: block;
    min-width: 290px;
  }
  .group-title {
    padding-left: 10px;
    padding-right: 10px;
    padding-top: 10px;
    max-width: 270px;
  }
  .stickies {
    display: flex;
    flex-wrap: wrap;
  }
  .glowing {
    outline: none;
    border-color: #9ecaed;
    box-shadow: 0 0 10px #9ecaed !important;
  }
  .tilted {
    transform: rotate(3deg);
    box-shadow: 6px 6px 10px rgba(0, 0, 0, 0.5) !important;
  }
  .sticky {
    background-color: #d4f3ee;
    flex-basis: 200px;
    height: 200px;
    min-width: 250px;
    margin: 10px;
    padding: 10px;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .sticky-content {
    overflow-y: auto;
    max-width: 300px;
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
</style>
