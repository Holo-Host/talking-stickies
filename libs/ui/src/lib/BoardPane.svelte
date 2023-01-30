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
  import { BoardType, UngroupedId, type Sticky } from "./board";
  import { mdiCog, mdiExport, mdiNotePlusOutline } from '@mdi/js';
  import { Button, Icon } from "svelte-materialify"
  import EditBoardDialog from "./EditBoardDialog.svelte";

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

  $: sortedStickies = sortStickies(stickies);
  $: groupedStickies = groupStickies(sortedStickies);
  $: totalStickies = stickies ? stickies.length : 0
  $: stickesCounts = countStickies(sortedStickies)

  let creatingInGroup: uuidv1 | undefined = undefined;
  let editText = "";
  let editingStickyId: uuidv1

  let groupIds = []
  let groups = []
  let ungroupedStickies = 0

  const countStickies = (stickies) : {} => {
    let counts = {}
    stickies.forEach((sticky: Sticky) => {
      counts[sticky.group] = counts[sticky.group] != undefined ? counts[sticky.group]+1 : 1
    })
    return counts
  }
    
  const groupStickies = (stickies) => {
    ungroupedStickies = 0
    if ($state) {
      groups = cloneDeep($state.groups);
      groupIds = groups.map(c => c.id)

      stickies.forEach((sticky) => {
        if (!groupIds.includes(sticky.group)) ungroupedStickies += 1
      });
      groups.unshift({id:UngroupedId, name:""})
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

  const inGroup = (curGroupId, groupId) => {
    return curGroupId === groupId || (curGroupId === 0 && !groupIds.includes(groupId))
  }
  const groupWidth = (groupId) : string => {
    const len = groups.length > 0 ? (stickesCounts[UngroupedId] > 0 ? groups.length : groups.length - 1) : 1
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
</script>

<div class="board">
  {#if editing}
    <EditBoardDialog bind:active={editing} boardHash={cloneDeep($activeHash)} boardType={BoardType.Stickies}></EditBoardDialog>
  {/if}

  <div class="top-bar">
    <div class="left-items">
      {#if $state.groups.length == 0}
        <Button size=small icon on:click={newSticky(UngroupedId)} title="New Sticky">
          <Icon path={mdiNotePlusOutline} />
        </Button>
      {/if}
      Sort By: <SortSelector {setSortOption} {sortOption} />
    </div>
    <div class="right-items">
      <Button size=small icon on:click={()=>editing=true} title="Settings">
        <Icon path={mdiCog} />
      </Button>
      <Button size=small icon on:click={() => pane.exportBoard($state)} title="Export Board">
        <Icon path={mdiExport} />
      </Button>
    </div>
  </div>
  {#if $state}
    <div class="groups">
      {#each groups as curGroup}
        {#if (curGroup.id !== UngroupedId || ungroupedStickies > 0)}
        <div class="group" style:width={groupWidth(curGroup.id)}>
          {#if $state.groups.length > 0}
          <div class="group-title">
            <b>{#if curGroup.id === UngroupedId}Ungrouped{:else}{curGroup.name}{/if}</b>
              <Button size=small icon on:click={newSticky(curGroup.id)} title={`New Sticky in {curGroup.name}`}>
                <Icon path={mdiNotePlusOutline} />
              </Button>
          </div>
          {/if}
          <div class="stickies">
          {#each sortedStickies as { id, text, votes, group, props } (id)}
            {#if editingStickyId === id && inGroup(curGroup.id, group)}
              <StickyEditor
                handleSave={
                  pane.updateSticky(stickies, id, clearEdit)
                }
                handleDelete={
                  pane.deleteSticky(id, clearEdit)
                }
                {cancelEdit}
                text={editText}
                groupId={group}
                groups={groups}
                props={props}
              />
            {:else if  inGroup(curGroup.id, group)}
              <div class="sticky" on:click={editSticky(id, text)} 
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
          {#if creatingInGroup !==undefined && inGroup(curGroup.id, creatingInGroup)}
            <StickyEditor handleSave={createSticky} {cancelEdit} groups={groups} />
          {/if}
          </div>
        </div>
        {:else if groups.length===1 && creatingInGroup !==undefined}
        <StickyEditor handleSave={createSticky} {cancelEdit} groups={groups} />
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
    padding: 10px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    flex: 1;
  }
  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .left-items {
    display: flex;
  }
  .right-items {
    display: flex;
  }
  .groups {
    display: flex;
    flex-wrap: wrap;
  }
  .group {
    display: block;
    min-width: 290px;
  }
  .group-title {
    padding-left: 10px;
    padding-right: 10px;
    max-width: 270px;
  }
  .stickies {
    display: flex;
    flex-wrap: wrap;
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
