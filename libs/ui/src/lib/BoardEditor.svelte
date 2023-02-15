<script lang="ts">
    import {Button, Icon} from "svelte-materialify"
    import { mdiDelete, mdiDragVertical, mdiPlusCircleOutline } from '@mdi/js';
    import { Group, VoteType, BoardType, type BoardProps } from './board';
    import { onMount } from 'svelte';
  	import DragDropList, { VerticalDropZone, reorder, type DropEvent } from 'svelte-dnd-list';

    export let handleSave
    export let handleDelete = undefined
    export let cancelEdit
    export let text = ''
    export let props:BoardProps = {bgUrl: ""}
    export let groups: Array<Group>
    export let voteTypes: Array<VoteType>
    export let boardType: BoardType
    export let title

    let titleElement
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

    const addVoteType = () => {
      voteTypes.push(new VoteType(`🙂`, `description: edit-me`, 1))
      voteTypes = voteTypes
    }
    const deleteVoteType = (index) => () => {
      voteTypes.splice(index, 1)
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
    onMount( async () => {
      setBoardType(boardType)
      titleElement.focus()
    })

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        cancelEdit()
      } else if (e.key === "Enter" && e.ctrlKey) {
        handleSave(boardType, text, groups, voteTypes, props)
      } else  if (e.key === 'Tab') {
        // trap focus
        const tabbable = Array.from(document.querySelectorAll('input'))

        let index = tabbable.findIndex((elem)=>elem == document.activeElement)
  
        if (index === -1 && e.shiftKey) index = 0;

        index += tabbable.length + (e.shiftKey ? -1 : 1);
        index %= tabbable.length;

        //@ts-ignore
        tabbable[index].focus();
        e.preventDefault();
      }
    }

    const onDropGroups = ({ detail: { from, to } }: CustomEvent<DropEvent>) => {
      if (!to || from === to || from.dropZoneID !== "groups") {
        return;
      }

      groups = reorder(groups, from.index, to.index);
    }
    const onDropVoteTypes = ({ detail: { from, to } }: CustomEvent<DropEvent>) => {
      if (!to || from === to || from.dropZoneID !== "voteTypes") {
        return;
      }

      voteTypes = reorder(voteTypes, from.index, to.index);
    }
</script>

<svelte:window on:keydown={handleKeydown}/>
  <div class='board-editor'>
    <div class="dialog-title">{title}</div>
    <div class="edit-title">
      <div class="title-text">Title:</div> <input class='textarea' maxlength="60" bind:value={text} bind:this={titleElement} />
    </div>
    <div class="edit-groups unselectable">
      <div class="title-text">{groupsTitle}:
        <Button icon on:click={() => addGroup()}>
          <Icon size="20px" path={mdiPlusCircleOutline}/>
        </Button>
      </div>
      <DragDropList
        id="groups"
        type={VerticalDropZone}
	      itemSize={45}
        itemCount={groups.length}
        on:drop={onDropGroups}
        let:index
        itemClass="unselectable"
        >
        <div class="group">
          <Icon path={mdiDragVertical}/>
          <input class='textarea' bind:value={groups[index].name} />
          <Button icon on:click={deleteGroup(index)}>
            <Icon path={mdiDelete}/>
          </Button>
        </div>
      </DragDropList>
    </div>
    <div class="edit-vote-types unselectable">
      <div class="title-text">
        {#if boardType == BoardType.Stickies}
          Voting Types:
        {:else}
          Labels:
        {/if}

        <Button icon on:click={() => addVoteType()}>
          <Icon size="20px" path={mdiPlusCircleOutline}/>
        </Button>
      </div>
      <DragDropList
        id="voteTypes"
        type={VerticalDropZone}
	      itemSize={45}
        itemCount={voteTypes.length}
        on:drop={onDropVoteTypes}
        let:index
        itemClass="unselectable"
        >
        <div class="vote-type">
          <Icon path={mdiDragVertical}/>
          {#if boardType == BoardType.Stickies}
          <input class='textarea emoji-input' bind:value={voteTypes[index].emoji} title="emoji"/>
          <input class='textarea num-input' bind:value={voteTypes[index].maxVotes} title="max votes on type per card" />
          <input class='textarea' bind:value={voteTypes[index].toolTip} title="description"/>
          {:else}
          <input class='textarea emoji-input' bind:value={voteTypes[index].emoji} title="label emoji"/>
          <input class='textarea' bind:value={voteTypes[index].toolTip} title="label name"/>
          {/if}
          <Button icon on:click={deleteVoteType(index)} >
            <Icon path={mdiDelete} />
          </Button>
        </div>
      </DragDropList> 
    </div>
    <div class="edit-title">
      <div class="title-text">Background Image:</div> <input class='textarea' maxlength="255" bind:value={props.bgUrl} />
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
      <Button style="margin-left:10px" size="small" on:click={() => handleSave(boardType, text, groups, voteTypes, props)} class="primary-color">
        Save
      </Button>
    </div>
 </div>


   
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
  .title-text {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-weight: normal;
    font-size: 120%;
  }
  .unselectable {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
</style>
