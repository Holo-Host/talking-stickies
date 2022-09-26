<script>
    import ExIcon from './icons/ExIcon.svelte'
    import TrashIcon from './icons/TrashIcon.svelte'
    import CheckIcon from './icons/CheckIcon.svelte'
    import PlusIcon from './icons/PlusIcon.svelte'
    import UpIcon from './icons/UpIcon.svelte'
    import DownIcon from './icons/DownIcon.svelte'
    import { Group, VoteType } from './board';
  
    export let handleSave
    export let handleDelete = undefined
    export let cancelEdit
    export let text = ''
    export let groups = []
    export let voteTypes = []

    const addVoteType = () => {
      voteTypes.push(new VoteType(`🙂`, `description: edit-me`, 1))
      voteTypes = voteTypes
    }
    const deleteVoteType = (index) => () => {
      voteTypes.splice(index, 1)
      voteTypes = voteTypes
    }
    const moveVoteTypeUp = (index) => () => {
      const g = voteTypes[index] 
      voteTypes.splice(index, 1)
      voteTypes.splice(index-1,0,g)
      voteTypes = voteTypes
    }
    const moveVoteTypeDown = (index) => () => {
      const g = voteTypes[index] 
      voteTypes.splice(index, 1)
      voteTypes.splice(index+1,0,g)
      voteTypes = voteTypes
    }

    const addGroup = () => {
      groups.push(new Group(`group ${groups.length+1}`))
      groups = groups
    }
    const deleteGroup = (index) => () => {
      groups.splice(index, 1)
      groups = groups
    }
    const moveGroupUp = (index) => () => {
      const g = groups[index] 
      groups.splice(index, 1)
      groups.splice(index-1,0,g)
      groups = groups
    }
    const moveGroupDown = (index) => () => {
      const g = groups[index] 
      groups.splice(index, 1)
      groups.splice(index+1,0,g)
      groups = groups
    }
    // let text = textA
  </script>
  
  <style>
    .board-editor {
      display: flex;
      background-color: #D4F3EE;
      flex-basis: 270px;
      margin: 20px;
      padding: 10px;
      box-shadow: 4px 5px 13px 0px rgba(0,0,0,0.38);
      font-style: normal;
      font-weight: 600;
      font-size: 12px;
      line-height: 16px;
      color: #000000;
      flex-direction: column;
      justify-content: flex-start;
    }
    .textarea {
      background-color: rgba(255, 255, 255, 0.72);
      border: 1px solid #C9C9C9;
      box-sizing: border-box;
      border-radius: 3px;
      width: 100%;
    }
    .emoji-input {
      width: 30px;
    }
    .num-input {
      width: 20px;
    }
    .controls {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding-left: 7px;
      padding-top: 5px;
    }
    .group {
      display: flex;
      flex-direction: row;
    }
    .vote-type {
      display: flex;
      flex-direction: row;
    }
    .add-item {
      display: inline-block;
      height: 20px;
    }
  </style>
  
  <div class='board-editor'>
    <div class='controls'>
      <div on:click={cancelEdit}>
        <ExIcon />
      </div>
      <div on:click={() => handleSave(text, groups, voteTypes)}>
        <CheckIcon />
      </div>
      {#if handleDelete}
        <div on:click={handleDelete} style="width:20px">
          <TrashIcon />
        </div>
      {/if}
    </div>
    <div class="edit-title">
      Title: <input class='textarea' bind:value={text} />
    </div>
    <div class="edit-groups">
      Groups:
      <div class="add-item" on:click={() => addGroup()}>
        <PlusIcon />
      </div>

      {#each groups as group, i}
      <div class="group">
        <input class='textarea' bind:value={group.name} />
        {#if i > 0}
        <div on:click={moveGroupUp(i)} style="margin-left:5px;width:30px">
          <UpIcon />
        </div>
        {/if}
        {#if i < groups.length-1}
        <div on:click={moveGroupDown(i)} style="margin-left:5px;width:30px">
          <DownIcon />
        </div>
        {/if}
        <div on:click={deleteGroup(i)} style="margin-left:5px;width:24px">
          <TrashIcon />
        </div>
      </div>
      {/each}
    </div>
    <div class="edit-vote-types">
      Voting Types:
      <div class="add-item" on:click={() => addVoteType()}>
        <PlusIcon />
      </div>
      {#each voteTypes as voteType, i}
      <div class="vote-type">
        <input class='textarea emoji-input' bind:value={voteType.emoji} title="emoji"/>
        <input class='textarea num-input' bind:value={voteType.maxVotes} title="max votes on type per card" />
        <input class='textarea' bind:value={voteType.toolTip} title="description"/>
        {#if i > 0}
        <div on:click={moveVoteTypeUp(i)} style="margin-left:5px;width:30px">
          <UpIcon />
        </div>
        {/if}
        {#if i < voteTypes.length-1}
        <div on:click={moveVoteTypeDown(i)} style="margin-left:5px;width:30px">
          <DownIcon />
        </div>
        {/if}
        <div on:click={deleteVoteType(i)} style="margin-left:5px;width:24px">
          <TrashIcon />
        </div>
      </div>
      {/each}
    </div>
  </div>