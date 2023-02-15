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
  import { mdiArchive, mdiArchiveCheck, mdiArrowRightThick, mdiCloseBoxOutline, mdiCog, mdiExport, mdiPlusCircleOutline } from "@mdi/js";
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
    ? sortBy((sticky: Sticky) => countLabels(sticky.props, sortOption) * -1)
    : (items) => items;

  $: unused = groupCards(items);
  $: avatars = tsStore.boardList.avatars()

  let creatingInColumn: uuidv1 | undefined = undefined;
  let editText = "";
  let editingCardId: uuidv1

  let columns:Dictionary<Group> = {}
  let cardsMap:Dictionary<Sticky> ={}

  let showArchived = false

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
    editingCardId = undefined;
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

  const countLabels = (props, type) : number | undefined => {
    if (typeof props["labels"] === 'undefined') {
      return undefined
    }
    return props["labels"].includes(type) ? 1 : 0
  };

  const closeBoard = () => {
    tsStore.boardList.closeActiveBoard();
  };
  let editing = false
  let dragOn = true
  let draggingHandled = true
  let draggedItemId = ""
  let dragWithSelf = false
  let dragTarget = ""
  let dragOrder : undefined|number = undefined
  function handleDragStart(e) {
    draggingHandled = false
    //console.log("handleDragStart", e)
    e.dataTransfer.dropEffect = "move";
//    e.dataTransfer.setDragImage(e.target)
    draggedItemId = e.target.getAttribute('id')
    e.dataTransfer
      .setData("text", e.target.getAttribute('id'));
  }

  function handleDragEnd(e) {
    clearDrag()
    //console.log("handleDragEnd",e )
  }
  const findColumnElement = (element: HTMLElement):HTMLElement => {
    while (element && !element.classList.contains("column")) {
      element = element.parentElement
    }
    return element
  }
  function handleDragEnter(e) {
   const column = findColumnElement(e.target as HTMLElement)
   //console.log("handleDragEnter", column )
   dragTarget = column ? column.id : ""
  }
  function handleDragLeave(e) {
    const target = e.target as HTMLElement
    //console.log("handleDragLeave", target )

    if (target.id == dragTarget) {
      dragTarget = ""
      dragOrder = undefined
    }
  }
  function handleDragOver(e) {
    e.preventDefault()
    const target = e.target as HTMLElement
    const column = findColumnElement(target)
    const cardsInColumn = $state.grouping[column.id]
    dragOrder = 0
    dragWithSelf = false
    for (const cardId of cardsInColumn) {
      const rect = document.getElementById(cardId).getBoundingClientRect()
      // if we are over ourself ingore!
      if (cardId == draggedItemId) {
        dragWithSelf = true
      }
      if (e.y < rect.y+rect.height/2) {
        break
      }
      dragOrder += 1
    }
  }
  function handleDragDropColumn(e:DragEvent) {
    e.preventDefault();
    if (draggingHandled) {
      return
    }
    const column = findColumnElement(e.target as HTMLElement)
    var srcId = e.dataTransfer.getData("text");
    if (column.id) {
      if (dragWithSelf) {
        dragOrder-=1
      }
      pane.dispatch("requestChange",[{ type: "update-sticky-group", id:srcId, group:column.id, index: dragOrder }])
    }
    clearDrag()
    //console.log("handleDragDropColumn",e, column )
  }
  const clearDrag = () => {
    draggingHandled = true
    draggedItemId = ""
    dragTarget = ""
    dragOrder = undefined
    dragWithSelf = false
  }

  const isLabeled = (props, type: string) :boolean => {
    return (props["labels"]!== undefined) && props["labels"].includes(type)
  }

  $: sortedColumns = () => {
    if (showArchived) {
      // make sure the ungrouped group is at the end.
      let cols = $state.groups.map((group)=> [group.id, $state.grouping[group.id]])
      const idx = cols.findIndex(([id,_]) => id == UngroupedId)
      const g = cols.splice(idx,1)
      return cols.concat(g)
    } else {
     return $state.groups.filter(g=> g.id != UngroupedId).map((group)=> [group.id, $state.grouping[group.id]])
    }
  }

</script>
<div class="board">
  {#if editing}
    <EditBoardDialog bind:active={editing} boardHash={cloneDeep($activeHash)} boardType={BoardType.KanDo}></EditBoardDialog>
  {/if}
  <div class="top-bar">
    <div class="left-items">
      <h5>{$state.name}</h5>
    </div>
    <div class="right-items">
      <div class="sortby">
        Sort: <SortSelector {setSortOption} {sortOption} />
      </div>
      <div class="archived">
        <Button size=small icon on:click={()=>showArchived=!showArchived} title={showArchived ? "Hide Archived Cards" : "Show Archived Cards"}>
          <Icon path={showArchived ? mdiArchiveCheck : mdiArchive} />
        </Button>
      </div>
      <Button size=small icon on:click={()=>editing=true} title="Settings">
        <Icon path={mdiCog} />
      </Button>
      <Button size=small icon on:click={() => pane.exportBoard(BoardType.KanDo, $state)} title="Export">
        <Icon path={mdiExport} />
      </Button>
      <Button size=small icon on:click={closeBoard} title="Close">
        <Icon path={mdiCloseBoxOutline} />
      </Button>
    </div>
  </div>
  {#if $state}
    <div class="columns">
      {#each sortedColumns() as [columnId, cardIds], i}
        <div class="column-wrap">
        <div class="column"
          class:glowing={dragTarget == columnId}
          class:first-column={i==0}
          id={columnId}
          on:dragenter={handleDragEnter} 
          on:dragleave={handleDragLeave}  
          on:drop={handleDragDropColumn}
          on:dragover={handleDragOver}
          >
          <div class="column-item column-title">
            <div>{columnId === UngroupedId ? "Archived" : columns[columnId].name}</div>
          </div>
          <div class="cards">
          {#each sorted(cardIds, sortCards) as { id:cardId, text, votes, props }, i}
              {#if editingCardId === cardId}
                <CardEditor
                  title="Edit Card"
                  handleSave={
                    pane.updateSticky(items, cardId, clearEdit)
                  }
                  handleDelete={
                    columnId === UngroupedId ?
                      pane.deleteSticky(cardId, clearEdit) :
                      undefined
                  }
                  handleArchive={
                    columnId !== UngroupedId ?
                    () => {
                      pane.dispatch("requestChange",[{ type: "update-sticky-group", id:cardId, group:UngroupedId  }])
                      clearEdit()
                    } :
                    undefined
                  }
                  {cancelEdit}
                  text={editText}
                  groupId={columnId}
                  props={props}
                  avatars={avatars}
                  active={editingCardId}
                  labelTypes={$state.voteTypes}
                />
              {/if}
                {#if 
                  dragTarget == columnId && 
                  cardId!=draggedItemId && 
                  dragOrder == i && 
                  (!dragWithSelf || $state.grouping[columnId][dragOrder-1] != draggedItemId) }
                 <div> <Icon path={mdiArrowRightThick} /> </div>
                {/if}
                <div 
                  class="card"
                  class:tilted={draggedItemId == cardId}
                  class:first-card={i==0}
                  id={cardId}
                  draggable={dragOn}
                  on:dragstart={handleDragStart}
                  on:dragend={handleDragEnd}


                  on:click={editCard(cardId, text)} 
                  style:background-color={props && props["color"] ? props["color"] : "white"}
                  >
                  <div class="labels">
                    {#each $state.voteTypes as {type, emoji, toolTip}}
                      {#if isLabeled(props, type)}
                        <div title={toolTip}>
                        <EmojiIcon emoji={emoji} class="vote-icon"/>
                        </div>
                      {/if}
                    {/each}
                  </div>
                  <div class="card-content">
                    {@html Marked.parse(text)}
                  </div>
                  {#if props && props.agents && props.agents.length > 0}
                    {#each props.agents as agent}
                      <span class="avatar-name" title={agent}>{$avatars[agent] ? $avatars[agent].name : `${agent.substring(0,8)}...`}</span>
                    {/each}
                  {/if}
                </div>
          {/each}
          {#if dragTarget == columnId && dragOrder == $state.grouping[columnId].length}
            <div> <Icon path={mdiArrowRightThick} /> </div>
          {/if}

          </div>
          {#if creatingInColumn !==undefined  && creatingInColumn == columnId}
            <CardEditor                   
              title="New Card"
              handleSave={createCard} {cancelEdit} avatars={avatars} active={creatingInColumn} labelTypes={$state.voteTypes}/>
          {/if}
          <div class="column-item column-footer">
            <Button style="padding: 0 5px;" size="small" text on:click={newCard(columnId)}>
              Add Card
              <Icon style="margin-left:5px" size="20px" path={mdiPlusCircleOutline}/>
            </Button>
          </div>
        </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
<style>
  :global(.dialog-title) {
    display: flex;
    justify-content: space-between;
    font-size: 110%;
    font-weight: bold;
    border-bottom: solid 1px gray;
    margin-bottom: 12px;
    margin-left: -20px;
    padding-left: 20px;
    padding-right: 20px;
    margin-right: -20px;
    margin-top: -20px;
    padding-top: 12px;
  }
  .board {
    display: flex;
    flex-direction: column;
    background: transparent;
    border-radius: 3px;
    margin-left: 15px;
    margin-right: 15px;
    margin-top: 15px;
    min-height: 0;
    overflow-x: auto;
    padding-bottom: 10px;
  }
  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background-color: #cccccc99;
    padding-left: 10px;
    padding-right: 10px;
    border-radius: 3px;
    color: white
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
    padding-right: 10px;
  }
  .archived {
  }
  .columns {
    display: flex;
    flex: 0 1 auto;
    max-height: 100%;
    background: transparent;
    min-height: 0;
  }
  .column-item {
    padding: 10px 10px 0px 10px;
    display: flex;
    align-items: center;
    flex: 0 1 auto;
  }
  .column-title {
    font-weight: bold;
  }
  .column-footer {
    border-top: 1px solid #999;
    padding: 0 5px;
    min-height: 38px;
  }
  .column-wrap {
    display: flex;
    flex-direction: column;
  }
  .column {
    display: flex;
    flex-direction: column;
    background-color: #eeeeeecc;
    width: 300px;
    margin-top: 10px;
    margin-left: 5px;
    border-radius: 3px;
    min-width: 130px;
    min-height: 0;
  }
  .first-column {
    margin-left: 0px !important;
  }
  .cards {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-height: 38px;
  }
  .glowing {
    outline: none;
    border-color: #9ecaed;
    box-shadow: 0 0 10px #9ecaed !important;
  }
  .tilted {
    transform: rotate(3deg);
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.5) !important;
  }
  .first-card {
    margin-top: 10px !important;
  }
  .card {
    background-color: white;
    margin: 0px 10px 10px 10px;
    padding: 5px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    border-radius: 3px;
  }
  .card-content {
    overflow-y: auto;
    max-height: 200px;
    margin-top: 16px;
    padding: 0 5px;
  }
  .labels {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin-top: 5px;
  }
  .avatar-name {
    border-radius: 5px;
    background-color: rgb(13, 145, 147);
    color: white;
    padding: 0 3px;
    padding-bottom: 2px;
    margin-right: 4px;
  }
</style>
