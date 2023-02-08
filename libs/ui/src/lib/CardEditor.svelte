<script lang="ts">
  import type { Dictionary } from "@holochain-open-dev/core-types";
  import MultiSelect from 'svelte-multiselect'
  import type { ObjectOption } from 'svelte-multiselect'
  import type { Avatar } from './boardList';
  import type { Readable } from 'svelte/store';
  import { Button, Dialog } from "svelte-materialify"
  import { onMount } from "svelte";
  import type { VoteType } from "./board";
  import EmojiIcon from "./icons/EmojiIcon.svelte";

  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit
  export let text = ''
  export let groupId = undefined
  export let props = {color: "white", agents:[]}
  export let avatars: Readable<Dictionary<Avatar>> 
  export let labelTypes: Array<VoteType>
  export let active = false

  let inputElement
  onMount(() => {
      inputElement.focus()
      if (props.agents !== undefined) {
        selectedAvatars = props.agents.map(a=> {return {label: $avatars[a].name ? $avatars[a].name : "unamed", value: a}})
      }
      if (props["labels"] !== undefined) {
        selectedLabels = props["labels"].filter(l=>labelTypes.findIndex(lt=>lt.type==l) >= 0).map(l=> {
          const idx = labelTypes.findIndex(lt => lt.type==l)
          const {emoji, toolTip} = labelTypes[idx]
          return {label: `${emoji} ${toolTip}`, value: l}
        })
      }
  }) 

  const colors=["white","#D4F3EE","#E0D7FF","#FFCCE1","#D7EEFF", "#FAFFC7", "red", "green", "yellow", "LightSkyBlue", "grey"]
  const setColor = (color) => {
    props.color  = color
    props = props
  }
  const setAgents = () => {
    props.agents = selectedAvatars.map(o => o.value)
    props = props
  }

  const avatarNames = () : ObjectOption[] => {
    const options:ObjectOption[] = Object.entries($avatars).map(([key,value]) => 
    {return {label: value.name ? value.name:key, value: key}} )
    return options
  }

  const labelOptions = () : ObjectOption[] => {
    const options:ObjectOption[] = labelTypes.map(({type, emoji, toolTip, maxVotes}) => 
    {return {label: `${emoji} ${toolTip}`, value: type}} )
    return options
  }

  const setLabels = () => {
    props["labels"] = selectedLabels.map(o => o.value)
    props = props
  }

  let selectedAvatars = []
  let selectedLabels = []

  const handleKeydown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave(text, groupId, props)
    }
    if (e.key === "Escape") {
      cancelEdit()
    }
  }

</script>
<Dialog persistent bind:active>
<div class='card-editor' style:background-color={props.color} on:keydown={handleKeydown}>
  <div class="multi-select">
    Labels: <MultiSelect bind:selected={selectedLabels} options={labelOptions()} on:change={(_event)=>setLabels()} />
  </div>
  {#if Object.keys($avatars).length > 0}
  <div class="multi-select">
    Assigned To: <MultiSelect bind:selected={selectedAvatars} options={avatarNames()} on:change={(_event)=>setAgents()} />
  </div>
  {/if}
  <div class="card-elements">
    <textarea class='textarea' bind:value={text} bind:this={inputElement} />
    <div class="color-buttons">
      {#each colors as color}
        <div class="color-button{props.color == color?" selected":""}" on:click={()=>setColor(color)} style:background-color={color}></div>
      {/each}
    </div>
  </div>
  <div class='controls'>
    {#if handleDelete}
      <Button text size="small" class="red white-text" on:click={handleDelete}>
        Delete
      </Button>
    {/if}
    <Button style="margin-left:5px" size="small"on:click={cancelEdit}>
      Cancel
    </Button>
    <Button style="margin-left:5px" size="small" class="primary-color" on:click={() => handleSave(text, groupId, props)}>
      Save
    </Button>
  </div>
</div>
</Dialog>
<style>
  .card-editor {
    display: flex;
    background-color: #D4F3EE;
    flex-basis: 270px;
    margin: 20px;
    padding: 10px;
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
  .multi-select {
    margin: 5px 0;
  }
  .controls {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-left: 7px;
    padding-top: 10px;
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
  .selected {
    outline: 1px #000 solid;
  }
</style>
