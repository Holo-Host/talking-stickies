<script lang="ts">
    import { Dialog, Button } from 'svelte-materialify';
  
    export let active = false;
    export let avatar
    export let handleSave

</script>

<Dialog persistent bind:active>
    <div class="avatar-editor">
        Name: <input class='textarea' bind:value={avatar.name} />

        <div class='controls'>
            <Button on:click={()=>active=false} style="margin-left:10px" size="small">
                Cancel
            </Button>
            <Button style="margin-left:10px" size="small" on:click={() => handleSave(avatar)} class="primary-color">
                Save
            </Button>
        </div>
    </div>
</Dialog>

<style>
    .avatar-editor {
      display: flex;
      flex-basis: 270px;
      margin: 20px;
      font-style: normal;
      font-weight: 600;
      color: #000000;
      flex-direction: column;
      justify-content: flex-start;
    }
    .controls {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      padding-left: 7px;
      padding-top: 10px;
    }
    .textarea {
      background-color: rgba(255, 255, 255, 0.72);
      border: 1px solid #C9C9C9;
      box-sizing: border-box;
      border-radius: 3px;
      width: 100%;
      font-weight: normal;
      padding: 5px;
    }
</style>