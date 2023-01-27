<script lang='ts'>
  import Button from "./Button.svelte"

  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit
  export let text = ''
  export let groupId = undefined
  export let groups = []
  export let props = {}
  const colors=["#D4F3EE","#E0D7FF","#FFCCE1","#D7EEFF", "#FAFFC7", "red", "green", "yellow", "LightSkyBlue", "grey"]
  const setColor = (color) => {
    // TODO fix later when there are more properties
    props = {color}
  }
  // let text = textA
</script>

<style>
  .sticky-editor {
    display: flex;
    background-color: #D4F3EE;
    flex-basis: 270px;
    height: 210px;
    width: 250px;
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
  .sticky-elements {
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
    height: 100%;
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
    outline: 2px #000 solid;
  }
</style>

<div class='sticky-editor' style:background-color={props.color}>
  <div class="sticky-elements">
  <textarea class='textarea' bind:value={text} />
  <div class="color-buttons">
    {#each colors as color}
      <div class="color-button{props.color == color?" selected":""}" on:click={()=>setColor(color)} style:background-color={color}></div>
    {/each}
  </div>
  {#if groups.length > 1 && groupId !== undefined}
    <select bind:value={groupId}>
      {#each groups as group}
        <option value={group.id}>
          {group.name}
        </option>
      {/each}
    </select>
  {/if}
  </div>
  <div class='controls'>
    {#if handleDelete}
      <Button on:click={handleDelete} class="secondary" style="align-self:flex-start">
        Delete
      </Button>
    {/if}
    <Button on:click={cancelEdit} class="secondary">
      Cancel
    </Button>
    <Button on:click={() => handleSave(text, groupId, props) } class="primary">
      Save
    </Button>
  </div>
</div>