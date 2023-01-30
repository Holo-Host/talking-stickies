<script lang="ts">
    import {Button, Icon} from "svelte-materialify"
    import { mdiPlusCircle, mdiDelete } from '@mdi/js';
    import UpIcon from './icons/UpIcon.svelte'
    import DownIcon from './icons/DownIcon.svelte'
    import { Group, VoteType, BoardType } from './board';
    import { onMount } from 'svelte';
  
    export let handleSave
    export let handleDelete = undefined
    export let cancelEdit
    export let text = ''
    export let groups = []
    export let voteTypes = []
    export let boardType: BoardType

    let groupsTitle = "Groups"
    let defaultGroupName = "group"

    const setBoardType = (newBoardType: BoardType) => {
      if (newBoardType == BoardType.Stickies) {
        groupsTitle = "Groups"
        defaultGroupName = "group"
      } else {
        if (groups.length == 0) {
          groups = [new Group("Backlog"), new Group("Prioritized"), new Group("Doing"), new Group("Done")]
        }
        groupsTitle = "Columns"
        defaultGroupName = "column"
      }
    }

 
    const onTypeChange = (event) => {
      setBoardType(event.currentTarget.value)
    }
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
      groups.push(new Group(`${defaultGroupName} ${groups.length+1}`))
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
    
    onMount( async () => {
      setBoardType(boardType)
    })

</script>
  
  <style>
    .board-editor {
      display: flex;
      flex-basis: 270px;
      margin: 20px;
      font-style: normal;
      font-weight: 600;
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
      padding: 5px;
      margin-right: 5px;
      margin-bottom: 5px;
      font-weight: normal;
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
      justify-content: flex-end;
      padding-left: 7px;
      padding-top: 10px;
    }
    .group {
      display: flex;
      flex-direction: row;
    }
    .vote-type {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
  </style>
  
  <div class='board-editor'>
    <div class="edit-title">
      Title: <input class='textarea' bind:value={text} />
    </div>
    <div class="edit-groups">
      {groupsTitle}:
      <Button icon on:click={() => addGroup()}>
        <Icon path={mdiPlusCircle}/>
      </Button>

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
        <Button icon on:click={deleteGroup(i)} style="margin-left:5px;">
          <Icon path={mdiDelete}/>
        </Button>
      </div>
      {/each}
    </div>
    <div class="edit-vote-types">
      Voting Types:
      <Button icon on:click={() => addVoteType()}>
        <Icon path={mdiPlusCircle}/>
      </Button>
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
        <Button icon on:click={deleteVoteType(i)} style="margin-left:5px;">
          <Icon path={mdiDelete} />
        </Button>
      </div>
      {/each}
    </div>
    <div class='controls'>
      {#if handleDelete}
        <Button on:click={handleDelete} size="small">
          Archive
        </Button>
      {/if}
      <Button on:click={cancelEdit} style="margin-left:10px" size="small">
        Cancel
      </Button>
      <Button style="margin-left:10px" size="small" on:click={() => handleSave(boardType, text, groups, voteTypes)} class="primary-color">
        Save
      </Button>
    </div>
 </div>