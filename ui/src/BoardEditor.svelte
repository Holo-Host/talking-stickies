<script>
    import ExIcon from './icons/ExIcon.svelte'
    import TrashIcon from './icons/TrashIcon.svelte'
    import CheckIcon from './icons/CheckIcon.svelte'
    import PlusIcon from './icons/PlusIcon.svelte'
    import { Group } from './board';
  
    export let handleSave
    export let handleDelete = undefined
    export let cancelEdit
    export let text = ''
    export let groups = []
    const addGroup = () => {
      groups.push(new Group(`group ${groups.length+1}`))
      groups = groups
    }
    const deleteGroup = (index) => () => {
      groups.splice(index, 1)
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
      height: 100%;
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
    .add-group {
      display: inline-block;
      height: 20px;
    }
  </style>
  
  <div class='board-editor'>
    <div class='controls'>
      <div on:click={cancelEdit}>
        <ExIcon />
      </div>
      <div on:click={() => handleSave(text, groups)}>
        <CheckIcon />
      </div>
      {#if handleDelete}
        <div on:click={handleDelete}>
          <TrashIcon />
        </div>
      {/if}
    </div>
    <div class="edit-title">
      Title: <textarea class='textarea' bind:value={text} />
    </div>
    <div class="edit-groups">
      Groups:
      <div class="add-group" on:click={() => addGroup()}>
        <PlusIcon />
      </div>

      {#each groups as group, i}
      <div class="group">
        <textarea class='textarea' bind:value={group.name} />
        <div on:click={deleteGroup(i)}>
          <TrashIcon />
        </div>
      </div>
      {/each}
    </div>
  </div>