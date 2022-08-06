<script lang="ts">
  import { createEventDispatcher, getContext } from 'svelte'
  import StickyEditor from './StickyEditor.svelte'
  import PlusIcon from './icons/PlusIcon.svelte'
  import SpeakingIcon from './icons/SpeakingIcon.svelte'
  import QuestionIcon from './icons/QuestionIcon.svelte'
  import StarIcon from './icons/StarIcon.svelte'
  import { v1 as uuidv1 } from 'uuid';
  import { sortBy } from 'lodash/fp'
  import type { TalkingStickiesStore } from './talkingStickiesStore';
  import { unnest } from '@holochain-syn/store';
  import SortSelector from './SortSelector.svelte'

  export let agentPubkey
 
  $: sortOption = null

  function setSortOption (newSortOption) {
    console.log('setting sort option', newSortOption)
    sortOption = newSortOption
  }

  const dispatch = createEventDispatcher()
 
  const { getStore } = getContext('tsStore');
  let tsStore: TalkingStickiesStore = getStore()

  $: state = unnest(tsStore.activeBoard, s=>s.session.state)
  $: stickies = $state.stickies
  $: sortStickies = sortOption
    ? sortBy(sticky => countVotes(sticky.votes, sortOption) * -1)
    : stickies => stickies

  $: sortedStickies = sortStickies(stickies)

  let creating = false

  const newSticky = () => {
    creating = true
  }

  const clearEdit = () => {
    editingStickyId = null
    editText = ''
  }

  let editingStickyId
  let editText = ''
  const getEditText = () => {return editText}

  const editSticky = (id, text) => () => {
    editingStickyId = id
    editText = text
  }

  const cancelEdit = () => {
    creating = false
    clearEdit()
  }

  const addSticky = text => {
    dispatch('requestChange', [
      {type: 'add-sticky', value: {
        id: uuidv1(),
        text,
        votes: {
          talk: {}, star: {}, question: {}
        }
      }}
    ])
    creating = false
  }

  const deleteSticky = id => () => {
    dispatch('requestChange', [
      {type: 'delete-sticky', id}
    ])
    clearEdit()
  }

  const updateSticky = id => text => {
    const sticky = stickies.find(sticky => sticky.id === id)
    if (!sticky) {
      console.error("Failed to find sticky with id", id)
      return
    }

    dispatch('requestChange', [
      {type: 'update-sticky-text',
       id: sticky.id,
       text: text
      }
    ])
    clearEdit()
  }

  const voteOnSticky = (id, type) => {
    const sticky = stickies.find(sticky => sticky.id === id)
    if (!sticky) {
      console.error("Failed to find sticky with id", id)
      return
    }

    const votes = {
      ...sticky.votes,
      [type]: {
        ...sticky.votes[type],
        [agentPubkey]: ((sticky.votes[type][agentPubkey] || 0) + 1) % 4
      }
    }

    console.log('VOTING', agentPubkey)
    console.log('votes before', sticky.votes)
    console.log('votes after', votes)

    dispatch('requestChange', [
      {type: 'update-sticky-votes', 
      id: sticky.id,
      votes
      }
    ])
  }

  const countVotes = (votes, type) => {
    const agentKeys = Object.keys(votes[type])
    return agentKeys.reduce((total, agentKey) => total + (votes[type][agentKey] || 0), 0)
  }

  const myVotes = (votes, type) => {
    return votes[type][agentPubkey] || 0
  }

  const VOTE_TYPE_TO_COMPONENT = {
    talk: SpeakingIcon,
    star: StarIcon,
    question: QuestionIcon
  }

</script>

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

  .stickies {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .sticky {
    background-color: #D4F3EE;
    flex-basis: 212px;
    min-height: 100px;
    margin: 25px;
    padding: 20px;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    text-align: center;
    color: #000000;
    display: flex;
    flex-direction: column;
  }
  .add-sticky {
    display: flex;
    align-items: center;
    max-height: 30px;
    margin-left: 25px;
  }
  .add-sticky :global(svg) {
    margin-right: 6px;
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

<div class='board'>
  <div class='top-bar'>
    <div class='add-sticky' on:click={newSticky}>
      <PlusIcon  />Add Sticky
    </div>
    <SortSelector setSortOption={setSortOption} sortOption={sortOption} />
  </div>

  <div class='stickies'>
    {#each sortedStickies as { id, text, votes } (id)}
      {#if editingStickyId === id}
        <StickyEditor handleSave={updateSticky(id)} handleDelete={deleteSticky(id)} {cancelEdit} text={editText} />
      {:else}
        <div class='sticky' on:click={editSticky(id, text)}>
          {text}
          <div class='votes'>
            {#each ['talk', 'star', 'question'] as type }
              <div
                class="vote"
                class:voted={myVotes(votes, type) > 0}
                on:click|stopPropagation={() => voteOnSticky(id, type)}>
                <svelte:component this={VOTE_TYPE_TO_COMPONENT[type]} /> {countVotes(votes, type)}
                <div class='vote-counts'>
                {#each new Array(myVotes(votes, type)).map((_, i) => i) as index }
                  <div class='vote-count' />
                {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/each}
    {#if creating}
      <StickyEditor handleSave={addSticky} {cancelEdit} />
    {:else if stickies.length > 0}
      <div on:click={newSticky}>
        <PlusIcon  />
      </div>
    {/if}
  </div>

</div>
