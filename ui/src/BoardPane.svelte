<script lang="ts">
  import { createEventDispatcher, getContext } from "svelte";
  import StickyEditor from "./StickyEditor.svelte";
  import PlusIcon from "./icons/PlusIcon.svelte";
  import ExIcon from "./icons/ExIcon.svelte";
  import SpeakingIcon from "./icons/SpeakingIcon.svelte";
  import QuestionIcon from "./icons/QuestionIcon.svelte";
  import StarIcon from "./icons/StarIcon.svelte";
  import { v1 as uuidv1 } from "uuid";
  import { sortBy } from "lodash/fp";
  import type { TalkingStickiesStore } from "./talkingStickiesStore";
  import SortSelector from "./SortSelector.svelte";
  import { Marked } from "@ts-stack/markdown";
  import { cloneDeep } from "lodash";

  $: sortOption = null;

  function setSortOption(newSortOption) {
    console.log("setting sort option", newSortOption);
    sortOption = newSortOption;
  }

  const dispatch = createEventDispatcher();

  const { getStore } = getContext("tsStore");
  let tsStore: TalkingStickiesStore = getStore();

  $: index = tsStore.activeBoardIndex;
  $: state = tsStore.getBoardState($index);
  $: stickies = $state ? $state.stickies : undefined;
  $: sortStickies = sortOption
    ? sortBy((sticky) => countVotes(sticky.votes, sortOption) * -1)
    : (stickies) => stickies;

  $: sortedStickies = sortStickies(stickies);
  $: groupedStickies = groupStickies(sortedStickies);

  let creatingInGroup: number | undefined = undefined;
  let groupIds = []
  let groups = []
  let ungroupedStickies = 0

  const groupStickies = (stickies) => {
    ungroupedStickies = 0
    if ($state) {
      groups = cloneDeep($state.groups);
      groupIds = groups.map(c => c.id)
      console.log("groupIds", JSON.stringify(groupIds))

      stickies.forEach((stickie) => {
        console.log("stickie.group.id", stickie.group)
        if (!groupIds.includes(stickie.group)) ungroupedStickies += 1
      });
      groups.unshift({id: 0, name:""})
    }
  };

  const newSticky = (group) => () => {
    creatingInGroup = group;
  };

  const clearEdit = () => {
    editingStickyId = null;
    editText = "";
  };

  let editingStickyId;
  let editText = "";

  const editSticky = (id, text) => () => {
    editingStickyId = id;
    editText = text;
  };

  const cancelEdit = () => {
    creatingInGroup = undefined;
    clearEdit();
  };

  const addSticky = (text) => {
    const stickie = {
      id: uuidv1(),
      text,
      group: creatingInGroup,
      votes: {
        talk: {},
        star: {},
        question: {},
      },
    };
    dispatch("requestChange", [{ type: "add-sticky", value: stickie }]);
    creatingInGroup = undefined;
  };

  const deleteSticky = (id) => () => {
    dispatch("requestChange", [{ type: "delete-sticky", id }]);
    clearEdit();
  };

  const updateSticky = (id) => (text, groupId) => {
    const sticky = stickies.find((sticky) => sticky.id === id);
    if (!sticky) {
      console.error("Failed to find sticky with id", id);
      return;
    }

    dispatch("requestChange", [
      { type: "update-sticky-text", id: sticky.id, text: text },
      { type: "update-sticky-group", id: sticky.id, group: parseInt(groupId) },
    ]);
    clearEdit();
  };

  const voteOnSticky = (id, type) => {
    const sticky = stickies.find((sticky) => sticky.id === id);
    if (!sticky) {
      console.error("Failed to find sticky with id", id);
      return;
    }
    const agent = tsStore.myAgentPubKey();
    const votes = {
      ...sticky.votes,
      [type]: {
        ...sticky.votes[type],
        [agent]: ((sticky.votes[type][agent] || 0) + 1) % 4,
      },
    };

    console.log("VOTING", agent);
    console.log("votes before", sticky.votes);
    console.log("votes after", votes);

    dispatch("requestChange", [
      {
        type: "update-sticky-votes",
        id: sticky.id,
        voteType: type,
        voter: agent,
        count: votes[type][agent],
      },
    ]);
  };

  const countVotes = (votes, type) => {
    const agentKeys = Object.keys(votes[type]);
    return agentKeys.reduce(
      (total, agentKey) => total + (votes[type][agentKey] || 0),
      0
    );
  };

  const myVotes = (votes, type) => {
    return votes[type][tsStore.myAgentPubKey()] || 0;
  };

  const VOTE_TYPE_TO_COMPONENT = {
    talk: SpeakingIcon,
    star: StarIcon,
    question: QuestionIcon,
  };

  const VOTE_TYPE_TO_TOOLTIP_TEXT = {
    talk: "I want to talk about this one.",
    star: "Interesting!",
    question: "I have questions about this one.",
  };

  const closeBoard = () => {
    tsStore.closeActiveBoard();
  };

  const inGroup = (curGroupId, groupId) => {
    return curGroupId === groupId || (curGroupId === 0 && !groupIds.includes(groupId))
  }
</script>

<div class="board">
  <div class="close-board" on:click={closeBoard}>
    <ExIcon />
  </div>
  <div class="top-bar">
    <h1>{$state.name}</h1>
    {#if $state.groups.length == 0}
      <div class="add-sticky" on:click={newSticky(0)} style="margin-left:5px">
        <PlusIcon />Add Sticky
      </div>
    {/if}
    <SortSelector {setSortOption} {sortOption} />
  </div>
  {#if $state}
    <div class="groups">
      {#each groups as curGroup}
        {#if (curGroup.id !== 0 || ungroupedStickies > 0)}
        <div class="group">
          {#if $state.groups.length > 0}
          <div class="group-title">
            <h2>{#if curGroup.id === 0}Ungrouped{:else}{curGroup.name}{/if}</h2>
              <div class="add-sticky" on:click={newSticky(curGroup.id)}>
                <PlusIcon />
              </div>
          </div>
          {/if}
          <div class="stickies">
          {#each sortedStickies as { id, text, votes, group } (id)}
            {#if editingStickyId === id && inGroup(curGroup.id, group)}
              <StickyEditor
                handleSave={updateSticky(id)}
                handleDelete={deleteSticky(id)}
                {cancelEdit}
                text={editText}
                groupId={group}
                groups={groups}
              />
            {:else if  inGroup(curGroup.id, group)}
              <div class="sticky" on:click={editSticky(id, text)}>
                {@html Marked.parse(text)}
                <div class="votes">
                  {#each ["talk", "star", "question"] as type}
                    <div
                      class="vote"
                      title={VOTE_TYPE_TO_TOOLTIP_TEXT[type]}
                      class:voted={myVotes(votes, type) > 0}
                      on:click|stopPropagation={() => voteOnSticky(id, type)}
                    >
                      <svelte:component this={VOTE_TYPE_TO_COMPONENT[type]} />
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
            {#if creatingInGroup !==undefined && inGroup(curGroup.id, creatingInGroup)}
            <StickyEditor handleSave={addSticky} {cancelEdit} groups={groups} />
          {/if}
        </div>
        {:else if groups.length===1 && creatingInGroup !==undefined}
        <StickyEditor handleSave={addSticky} {cancelEdit} groups={groups} />
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
    padding: 30px 60px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    flex: 1;
  }
  .top-bar {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .close-board {
    position: absolute;
    right: 45px;
    margin-top: -18px;
  }
  .add-sticky, h2 {
    display: inline-block;
  }
  .groups {
    display: flex;
    flex-wrap: wrap;
  }
  .group {
    display: block;
    flex-basis: 33%;
  }
  .stickies {
    display: flex;
    flex-wrap: wrap;
  }
  .sticky {
    background-color: #d4f3ee;
    flex-basis: 200px;
    min-height: 100px;
    min-width: 200px;
    margin: 10px;
    padding: 10px;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    display: flex;
    flex-direction: column;
  }
  .add-sticky :global(svg) {
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
  .vote :global(svg) {
    margin-right: auto;
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
