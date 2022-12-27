<script lang="ts">
  import { getContext } from 'svelte'
  import { get } from 'svelte/store';
  import PlusIcon from './icons/PlusIcon.svelte'
  import ImportIcon from './icons/ImportIcon.svelte';
  import PencilIcon from './icons/PencilIcon.svelte'
  import UnarchiveIcon from './icons/UnarchiveIcon.svelte'
  import ReloadIcon from './icons/ReloadIcon.svelte'
  import AvatarIcon from './icons/AvatarIcon.svelte'
  import type { TalkingStickiesStore } from './talkingStickiesStore';
  import BoardEditor from './BoardEditor.svelte'
  import { isEqual } from 'lodash'
  import { cloneDeep } from "lodash";
  import { Group, VoteType, DEFAULT_VOTE_TYPES, Board, BoardType } from './board';
  import type { EntryHashB64 } from '@holochain/client';
  import type { BoardState } from './board';
  import AvatarEditor from './AvatarEditor.svelte';
  import type { Avatar } from './boardList';
  import Participants from './Participants.svelte';
  import {HoloIdenticon} from "@holochain-open-dev/elements";

  export let boardType:BoardType = BoardType.Stickies

  if (!customElements.get('holo-identicon')){
      customElements.define('holo-identicon', HoloIdenticon)
    }
  const { getStore } :any = getContext('tsStore');

  const store:TalkingStickiesStore = getStore();

  const myAgentPubKey = store.myAgentPubKey()

  $: boardList = store.boardList.stateStore()

  $: activeHash = store.boardList.activeBoardHash
  $: participants = store.boardList.participants()
  $: avatars = store.boardList.avatars()

  let editingBoardHash: EntryHashB64
  let editName = ''
  let editGroups = []
  let editVoteTypes = []
  let creating = false

  let editingAvatar = false
  let showParticipants = false
  let avatar: Avatar = {name:"", url:""}
  $: myName = $avatars[myAgentPubKey]? $avatars[myAgentPubKey].name : ""
  let loading = false
  const newBoard = () => {
    editVoteTypes = cloneDeep(DEFAULT_VOTE_TYPES)
    creating = true
  }

	let fileinput;
	let showArchived = false

	const onFileSelected = (e)=>{
    let file = e.target.files[0];
    let reader = new FileReader();

    reader.addEventListener("load", async () => {
      const b = JSON.parse(reader.result as string)
      const board = await store.boardList.makeBoard(b)
      selectBoard(board.hashB64())
    }, false);
    reader.readAsText(file);
  };

  const addBoard = async (type: BoardType, name: string, groups: Group[], voteTypes: VoteType[]) => {
    const board = await store.boardList.makeBoard({type, name, groups, voteTypes})
    console.log("ADD BOARD", board, groups)
    selectBoard(board.hashB64())
    creating = false
  }
  
  const selectBoard = (hash: EntryHashB64) => {
    store.boardList.setActiveBoard(hash)
  }

  const archiveBoard = (hash: EntryHashB64) => () => {
    store.boardList.archiveBoard(hash)
    cancelEdit()
  }

  const unarchiveBoard = (hash: EntryHashB64) => () => {
    store.boardList.unarchiveBoard(hash)
  }

  const editBoard = (hash: EntryHashB64) => async () => {
    const board: Board | undefined = await store.boardList.getBoard(hash)
    if (board) {
      const state = board.state()
      editingBoardHash = hash
      editName = state.name
      editGroups = cloneDeep(state.groups)
      editVoteTypes = cloneDeep(state.voteTypes)
    } else {
      console.log("board not found:", hash)
    }
  }

  const updateBoard = (hash: EntryHashB64) => async (_type:BoardType, name: string, groups: Group[], voteTypes: VoteType[]) => {
    // ignore board type we don't update that.
    const board: Board | undefined = await store.boardList.getBoard(hash)
    if (board) {
      let changes = []
      const state: BoardState = board.state()
      if (state.name != name) {
        console.log("updating board name to ",name)
        store.boardList.requestChanges([
          {
            type: 'set-name',
            hash: board.hashB64(),
            name: name
          }
        ])
        changes.push(
          {
            type: 'set-name',
            name: name
          })
      }
      if (!isEqual(groups, state.groups)) {
        console.log("with groups:", groups)
        changes.push({type: 'set-groups',
          groups: groups
          })
      }
      if (!isEqual(voteTypes, state.voteTypes)) {
        console.log("with voteTypes:", voteTypes)
        changes.push({type: 'set-vote-types',
          voteTypes: voteTypes
          })
      }
      if (changes.length > 0) {
        await store.boardList.requestBoardChanges(hash,changes)
      }
    }
    cancelEdit()
  }
	
  const cancelEdit = () => {
    editingBoardHash = null
    editName = ""
    editGroups = []
    editVoteTypes = []
    creating = false
  }
  
  const editAvatar = () => {
    const myAvatar = $avatars[store.myAgentPubKey()]
    if (myAvatar) {
      avatar = myAvatar
    }
    editingAvatar = true
  }

  const setAvatar = (avatar: Avatar) => {
    store.boardList.requestChanges([{type:'set-avatar', pubKey:store.myAgentPubKey(), avatar:cloneDeep(avatar)}])
    closeEditAvatar()
  }

  const closeEditAvatar = () => {
    editingAvatar = false
  }

  const reloadBoards = async () => {
    loading = true
    await store.loadBoards()
    loading = false
  }

  const showParticpants = () => {
    showParticipants = true
  }
  const closeParticpants = () => {
    showParticipants = false
  }
</script>


<div class='boards'>
    <div class='participants' on:click={showParticpants}>
    Participants: {$participants.active.length }
    </div>
    <div class='avatar-button' on:click={editAvatar} title={myName}>
      <AvatarIcon/>
    </div>
    {#if editingAvatar}
        <AvatarEditor handleSave={setAvatar} cancelEdit={closeEditAvatar} avatar={avatar} />
    {/if}

    {#if showParticipants}
        <Participants active={get(participants).active} avatars={$avatars} close={closeParticpants} />
    {/if}


    <!-- <div class='reload-boards' on:click={reloadBoards} title="Reload Boards">
      <ReloadIcon spinning={loading}/>
    </div> -->
    <div class='top-bar'>
        <div class='top-board-button' on:click={newBoard} title="New board">
            <PlusIcon  />
        </div>
        <div class='top-board-button' on:click={()=>{fileinput.click();}} title="Import board from JSON file">
          <ImportIcon  />
          <input style="display:none" type="file" accept=".json" on:change={(e)=>onFileSelected(e)} bind:this={fileinput} >
        </div>
        <div class="last-button">
          <input type=checkbox bind:checked={showArchived}> Show Archived 
        </div>
    </div>
    <div class='board-list'>
        {#if creating}
        <BoardEditor handleSave={addBoard} {cancelEdit} boardType={boardType} voteTypes={editVoteTypes} />
        {/if}

        {#each $boardList.boards as board }
          {#if editingBoardHash === board.hash}
            <BoardEditor handleSave={updateBoard(board.hash)} handleDelete={archiveBoard(board.hash)} {cancelEdit} text={editName} groups={editGroups} voteTypes={editVoteTypes} />
          {:else}
            {#if board.status !== "archived" }
              <div class="board {$activeHash === board.hash? "selected":""}" on:click={() => selectBoard(board.hash)}>
                {board.name}
                <div class="board-button" on:click={editBoard(board.hash)}><PencilIcon /></div>
              </div>
            {/if}
          {/if}
        {/each}
        {#if showArchived}
          {#each $boardList.boards as board, i }
            {#if board.status === "archived" }
              <div class="board archived" on:click={unarchiveBoard(board.hash)}>{board.name}<div class="board-button"><UnarchiveIcon /></div></div>
            {/if}
          {/each}
        {/if}
    </div>
  </div>

  <style>
    .boards {
      display: flex;
      flex-direction: column;
      padding: 30px 60px;
      background-color: white;
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
      border-radius: 3px;
      width: initial;
    }
    .board {
      background-color: rgb(204, 204, 204);
      border-radius: 3px;
      padding: 5px 5px;
      display: inherit;
      margin-right: 5px;
      border: 1px solid;
      cursor: default;
    }
    .board-button {
      margin-left: 5px;
      cursor:pointer;
    }
    .selected {
      background-color: rgb(183, 224, 180);
    }
    .archived {
      background-color: rgb(224, 224, 224);
      border: 1px dashed;
    }
    .top-bar {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    .board-list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: flex-start;
      flex-shrink: 1;
    }
    .avatar-button {
      position: absolute;
      right: 45px;
      margin-top: -18px;
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    .participants {
      position: absolute;
      right: 75px;
      margin-top: -18px;
      cursor:pointer;
    }
    .top-board-button {
      display: inline-block;
      height: 30px;
      margin-bottom: 10px;
      cursor: pointer;
    }
    .last-button {
      margin-left:auto;
    }
 
  </style>
  