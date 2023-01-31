<script lang="ts">
    import Toolbar from './Toolbar.svelte'
    import BoardPane from './BoardPane.svelte'
    import KanBanPane from './KanBanPane.svelte'
    import { TalkingStickiesStore } from './talkingStickiesStore'
    import { setContext } from 'svelte';
    import type { AppAgentClient } from '@holochain/client';
    import type { SynStore } from '@holochain-syn/store';
    import { BoardType } from './board';
    import { MaterialApp, Icon } from 'svelte-materialify';
    import { mdiShapeSquarePlus } from '@mdi/js';

    export let boardType:BoardType
    export let roleName = ""
  
    let synStore: SynStore;
    let tsStore: TalkingStickiesStore;
    
    export let client : AppAgentClient

    $: activeBoardIndex = tsStore ? tsStore.boardList.activeBoardHash : undefined
    $: activeBoardType = tsStore ? tsStore.boardList.activeBoardType : undefined

    initialize()

    setContext('synStore', {
      getStore: () => synStore,
    });
  
    setContext('tsStore', {
      getStore: () => tsStore,
    });

    $: boardList = tsStore? tsStore.boardList.stateStore() : undefined

    async function initialize() : Promise<void> {
      const store = createStore()
      synStore = store.synStore;
      try {
        await store.loadBoards()
        tsStore = store
      } catch (e) {
        console.log("Error loading boards:", e)
      }
    }
    function createStore() : TalkingStickiesStore {
      const store = new TalkingStickiesStore(
        client,
        roleName
      );
      return store
    }
  
  </script>
  
  <style>
    .app {
      margin: 0;
      padding-bottom: 10px;
      background-color: lightgray;
      height: 100vh;
    }
    :global(:root) {
      --resizeable-height: 200px;
      --tab-width: 60px;
    }
  
    @media (min-width: 640px) {
      .app {
        max-width: none;
      }
    }
    .welcome-text {
      border-radius: 5px;
      border: 1px solid #222;
      margin: 50px;
      padding: 26px;
      box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
      background-color: white;
    }
  </style>
  
  <svelte:head>
    <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
  </svelte:head>

  <MaterialApp>
    <div class='app'>

    {#if tsStore}
      <Toolbar boardType={boardType}/>
      {#if boardList && $boardList.boards.length == 0}
        <div class="welcome-text">
          <h5>Welcome!</h5>
          {#if boardType == BoardType.Stickies}
            <p>TalkingStickies offers real-time collaborative sticky-note boards for brain-storming, managing meetings, agendas, etc. </p>
          {:else}
            <p>KanBan offers real-time collaborative Kan Ban boards for task and project management. </p>
          {/if}
          <p>Click on the <Icon style="width:20px; color:black; vertical-align: bottom;"; path={mdiShapeSquarePlus}></Icon> above to create your first board. </p>
        </div>
      {/if}
      {#if $activeBoardIndex !== undefined}
        {#if $activeBoardType === BoardType.Stickies}
          <BoardPane on:requestChange={(event) => {tsStore.boardList.requestBoardChanges($activeBoardIndex,event.detail)}}/>
        {/if}
        {#if $activeBoardType === BoardType.KanBan}
          <KanBanPane on:requestChange={(event) => {tsStore.boardList.requestBoardChanges($activeBoardIndex,event.detail)}}/>
        {/if}
      {/if}
    {:else}
      Loading
    {/if}
  </div>
</MaterialApp>
