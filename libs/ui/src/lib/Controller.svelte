<script lang="ts">
    import Boards from './Boards.svelte'
    import Toolbar from './Toolbar.svelte'
    import BoardPane from './BoardPane.svelte'
    import { TalkingStickiesStore } from './talkingStickiesStore'
    import { setContext } from 'svelte';
    import type { InstalledCell } from '@holochain/client';
    import type { CellClient } from '@holochain-open-dev/cell-client';
    import type { SynStore } from '@holochain-syn/store';
   
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
    
    export let client : CellClient

    initialize()

    $: activeBoardIndex = tsStore ? tsStore.activeBoardIndex : undefined
    setContext('synStore', {
      getStore: () => synStore,
    });
  
    setContext('tsStore', {
      getStore: () => tsStore,
    });

    async function initialize() : Promise<void> {
      const store = createStore()
      synStore = store.synStore;
      tsStore = store
      console.log("Store Created")
      tsStore.joinExistingWorkspaces()
    }
    function createStore() : TalkingStickiesStore {
  
      const store = new TalkingStickiesStore(
        client,
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
      <Toolbar />
      <Boards />
      {#if $activeBoardIndex !== undefined}
        <BoardPane
          on:requestChange={(event) => {tsStore.requestChange(event.detail)}}/>
      {/if}
      <a class="issue" target="github" href="https://github.com/Holo-Host/talking-stickies/issues" title="Report a problem in our GitHub repo">Report Issue</a>
      {:else}
      Loading
    {/if}
  </div>