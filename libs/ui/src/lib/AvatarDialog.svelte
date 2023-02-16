<script lang="ts">
    import { Dialog, Button } from 'svelte-materialify';
    import AvatarIcon from './AvatarIcon.svelte';

    export let active = false;
    export let avatar
    export let handleSave

    const handleKeydown = (e) => {
      if (e.key === "Escape") {
        active=false
      } else if (e.key === "Enter" && e.ctrlKey && avatar.name!=="") {
        handleSave(avatar)
      }
    }

</script>
<svelte:window on:keydown={handleKeydown}/>

<Dialog persistent bind:active>
    <div class="avatar-editor">
      <div class="dialog-title">Edit Profile</div>
      Name: <input class='textarea' bind:value={avatar.name} />
      Avatar Image URL: 
      <span class="row">
        <AvatarIcon avatar={avatar} size={30} style="margin-right:10px"/>
        <input class='textarea' bind:value={avatar.url} />
      </span>
      <div class='controls'>
          <Button on:click={()=>active=false} style="margin-left:10px" size="small">
              Cancel
          </Button>
          <Button disabled={avatar.name==""} style="margin-left:10px" size="small" on:click={() => handleSave(avatar)} class={avatar.name!=="" ? "primary-color":""}>
              Save
          </Button>
      </div>
    </div>
</Dialog>

<style>
    .row {
      display: flex;
      align-items: center;
    }
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