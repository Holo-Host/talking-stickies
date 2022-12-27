<script lang="ts">
    import BoardList from './BoardList.svelte'
    import Toolbar from './Toolbar.svelte'
    import BoardPane from './BoardPane.svelte'
    import KanBanPane from './KanBanPane.svelte'
    import { TalkingStickiesStore } from './talkingStickiesStore'
    import { setContext } from 'svelte';
    import type { AppAgentClient } from '@holochain/client';
    import type { SynStore } from '@holochain-syn/store';
    import { BoardType } from './board';

    export let boardType: BoardType = BoardType.Stickies

    // The debug drawer's ability to resized and hidden
    let resizeable
    let resizeHandle
    const minDrawerSize = 0
    const maxDrawerSize = document.documentElement.clientHeight - 30 - 10
    const initResizeable = (resizeableEl) => {
      resizeableEl.style.setProperty('--max-height', `${maxDrawerSize}px`)
      resizeableEl.style.setProperty('--min-height', `${minDrawerSize}px`)
    }
  
    const setDrawerHeight = (height) => {
      document.documentElement.style.setProperty('--resizeable-height', `${height}px`)
    }
    const getDrawerHeight = () => {
      const pxHeight = getComputedStyle(resizeable)
        .getPropertyValue('--resizeable-height')
      return parseInt(pxHeight, 10)
    }
  
    const startDragging = (event) => {
      event.preventDefault()
      const host = resizeable
      const startingDrawerHeight = getDrawerHeight()
      const yOffset = event.pageY
  
      const mouseDragHandler = (moveEvent) => {
        moveEvent.preventDefault()
        const primaryButtonPressed = moveEvent.buttons === 1
        if (!primaryButtonPressed) {
          setDrawerHeight(Math.min(Math.max(getDrawerHeight(), minDrawerSize), maxDrawerSize))
          window.removeEventListener('pointermove', mouseDragHandler)
          return
        }
        setDrawerHeight(Math.min(Math.max((yOffset - moveEvent.pageY ) + startingDrawerHeight, minDrawerSize), maxDrawerSize))
      }
      const remove = window.addEventListener('pointermove', mouseDragHandler)
    }
  
    let drawerHidden = true
    const hideDrawer = () => {
      drawerHidden = true
    }
    const showDrawer = () => {
      drawerHidden = false
    }
  
    let tabShown = false;
    const showTab = () => {
      tabShown = true
    }
    const hideTab = () => {
      tabShown = false
    }
  
    let synStore: SynStore;
    let tsStore: TalkingStickiesStore;
    
    export let client : AppAgentClient

    $: activeBoardIndex = tsStore ? tsStore.boardList.activeBoardHash : undefined
    $: activeBoardType = tsStore ? tsStore.boardList.activeBoardType : undefined
    $: boardList = tsStore ? tsStore.boardList : undefined

    initialize()

    setContext('synStore', {
      getStore: () => synStore,
    });
  
    setContext('tsStore', {
      getStore: () => tsStore,
    });

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
        'talking-stickies'
      );
      return store
    }
  
  </script>
  
  <style>
    .app {
      grid-column: 1/3;
      grid-row: 1/2;
      /* width: 100%; */
      margin: 20px;
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
    .issue {
      position:absolute;
      top: 20px;
      right: 20px;
      padding: 10px;
      background-color: rgb(43, 198, 226);
      color: white;
      font-weight: bold;
      border: solid 3px black;
      border-radius: 10px;
    }
  </style>
  
  <svelte:head>
    <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
  </svelte:head>
  
  <div class='app'>
    {#if tsStore}
      <Toolbar title={boardType == BoardType.Stickies ? 'TalkingStickies' : 'KanBan' }/>
      {#if boardList}
      <BoardList boardType={boardType}/>
      {:else}
        Loading for board list...
      {/if}
      {#if $activeBoardIndex !== undefined}
        {#if $activeBoardType === BoardType.Stickies}
          <BoardPane on:requestChange={(event) => {tsStore.boardList.requestBoardChanges($activeBoardIndex,event.detail)}}/>
        {/if}
        {#if $activeBoardType === BoardType.KanBan}
          <KanBanPane on:requestChange={(event) => {tsStore.boardList.requestBoardChanges($activeBoardIndex,event.detail)}}/>
        {/if}
      {/if}
      <a class="issue" target="github" href="https://github.com/Holo-Host/talking-stickies/issues" title="Report a problem in our GitHub repo">Report Issue</a>
      {:else}
      Loading
    {/if}
  </div>