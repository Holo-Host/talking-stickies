<script lang="ts">
  import Board from './Board.svelte'
  import Toolbar from './Toolbar.svelte'
  import { scribeStr } from './stores.js'
  import { setContext } from 'svelte';
  import { AppWebsocket, InstalledCell } from '@holochain/client';
  import { TalkingStickiesStore } from './talkingStickiesStore';
  import { HolochainClient } from '@holochain-open-dev/cell-client';

  $: noscribe = $scribeStr === ''

  $: agentPubkey = ''

  function setAgentPubkey (newAgentPubkey) {
    console.log('setting agent pubkey', newAgentPubkey)
    agentPubkey = newAgentPubkey
  }

  $: sortOption = null

  function setSortOption (newSortOption) {
    console.log('setting sort option', newSortOption)
    sortOption = newSortOption
  }

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

  let synStore;
  let tsStore: TalkingStickiesStore;
  createStore().then(async store => {
    const sessions = await store.synStore.getAllSessions();
    console.log("HERE")
    if (Object.keys(sessions).length === 0) {
      store.synStore.newSession().then(() => {
        tsStore = store
        synStore = store.synStore;
        console.log("SESSION", synStore )

      });
    } else {
      for (const session of Object.keys(sessions)) {
        try {
          await store.synStore.joinSession(Object.keys(sessions)[0]);
          tsStore = store
          synStore = store.synStore;
          return;
        } catch (e) {}
      }
      store.synStore.newSession().then(() => {
        tsStore = store
        synStore = store.synStore;
        console.log("SESSION", synStore )
      });
    }
  });
  $: synStore;

  setContext('store', {
    getStore: () => synStore,
  });

  const appId = 'talking-stickies'

  async function createStore() : Promise<TalkingStickiesStore> {
    const appPort = process.env.HC_PORT ? process.env.HC_PORT : 8888
    const url = `ws://localhost:${appPort}`;
    const appWebsocket = await AppWebsocket.connect(url);
    const client = new HolochainClient(appWebsocket);

    console.log("CLIENT: ", client);

    console.log('Connecting with', appPort, appId)
    const appInfo = await client.appWebsocket.appInfo({
      installed_app_id: appId,
    });

    console.log("APP INFO: ");
    const installedCells = appInfo.cell_data;
    const talkingStickiesCell = installedCells.find(
      c => c.role_id === 'talking-stickies'
    ) as InstalledCell;
    const store = new TalkingStickiesStore(
      client,
      talkingStickiesCell,
    );
    return store
  }

</script>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 1000px;
  }
	main {
		padding: 1em;
    background: hsla(100, 20%, 50%, .2);
    grid-column: 1 / 2;
	}

  :global(:root) {
    --resizeable-height: 200px;
    --tab-width: 60px;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
    margin: auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<svelte:head>
  <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
</svelte:head>

<div class='app'>
  {#if tsStore}
    <Toolbar setSortOption={setSortOption} sortOption={sortOption} />
    <Board
      on:requestChange={(event) => {tsStore.requestChange(event.detail)}}
      agentPubkey={agentPubkey}
      sortOption={sortOption}/>
  {:else}
  Loading
  {/if}
</div>