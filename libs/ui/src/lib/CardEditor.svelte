<script lang="ts">
  import type { Dictionary } from "@holochain-open-dev/core-types";
  import MultiSelect from 'svelte-multiselect'
  import type { Option, ObjectOption } from 'svelte-multiselect'
  import type { Avatar } from './boardList';
  import type { Readable } from 'svelte/store';
  import {Button} from "svelte-materialify"

  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit
  export let text = ''
  export let groupId = undefined
  export let groups = []
  export let props = {color: "white", agents:[]}
  export let avatars: Readable<Dictionary<Avatar>> 

  const colors=["white","#D4F3EE","#E0D7FF","#FFCCE1","#D7EEFF", "#FAFFC7", "red", "green", "yellow", "LightSkyBlue", "grey"]
  const setColor = (color) => {
    props.color  = color
    props = props
  }
  const setAgents = () => {
    props.agents = selected.map(o => o.value)
    props = props
  }

  const avatarNames = () : ObjectOption[] => {
    const options:ObjectOption[] = Object.entries($avatars).map(([key,value]) => 
    {return {label: value.name ? value.name:key, value: key}} )
    return options
  }
  let selected = []
</script>


<div class='card-editor' style:background-color={props.color}>
  {#if groups.length > 1 && groupId !== undefined}
    <select bind:value={groupId}>
      {#each groups as group}
        <option value={group.id}>
          {group.name}
        </option>
      {/each}
    </select>
  {/if}
  <div class="card-elements">
    <textarea class='textarea' bind:value={text} />
    <div class="color-buttons">
      {#each colors as color}
        <div class="color-button{props.color == color?" selected":""}" on:click={()=>setColor(color)} style:background-color={color}></div>
      {/each}
    </div>
  </div>
  <div>
    Tagged: <MultiSelect bind:selected options={avatarNames()} on:change={(_event)=>setAgents()} />
  </div>
  <div class='controls'>
    {#if handleDelete}
      <Button text size="x-small" class="red white-text" on:click={handleDelete}>
        Delete
      </Button>
    {/if}
    <Button style="margin-left:5px" size="x-small"on:click={cancelEdit}>
      Cancel
    </Button>
    <Button style="margin-left:5px" size="x-small" class="primary-color" on:click={() => handleSave(text, groupId, props)}>
      Save
    </Button>
  </div>
</div>

<style>
  .card-editor {
    display: flex;
    background-color: #D4F3EE;
    flex-basis: 270px;
    margin: 10px;
    padding: 10px;
    box-shadow: 4px 5px 13px 0px rgba(0,0,0,0.38);
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    color: #000000;
    justify-content: space-between;
    flex-direction: column;
  }
  .card-elements {
    display: flex;
    flex-direction: row;
    flex-basis: 100%;
  }
  .textarea {
    background-color: rgba(255, 255, 255, 0.72);
    border: 1px solid #C9C9C9;
    box-sizing: border-box;
    border-radius: 3px;
    width: 100%;
    font-weight: normal;
    padding: 2px;
  }
  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-left: 7px;
    padding-top: 5px;
  }
  .color-buttons {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    margin-left: 5px;
  }
  .color-button {
    width: 15px;
    height: 15px;
    margin: 2px;
    outline: 1px lightgray solid;
  }
  select {
    margin-top:5px;
  }
  .selected {
    outline: 1px #000 solid;
  }
</style>
