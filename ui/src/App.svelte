<script lang="ts">
  import BoardPane from './BoardPane.svelte'
  import Boards from './Boards.svelte'
  import Toolbar from './Toolbar.svelte'
  import { scribeStr } from './stores.js'
  import { setContext } from 'svelte';
  import { AppWebsocket, InstalledCell } from '@holochain/client';
  import { TalkingStickiesStore } from './talkingStickiesStore';
  import { HolochainClient } from '@holochain-open-dev/cell-client';
  import type { SynStore, unnest } from '@holochain-syn/store';
  import type { TalkingStickiesGrammar } from './grammar';

  $: noscribe = $scribeStr === ''
 
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

  let synStore: SynStore<TalkingStickiesGrammar>;
  let tsStore: TalkingStickiesStore;
  


  createStore().then(async store => {
    synStore = store.synStore;
    tsStore = store
    console.log("Store Created")
    tsStore.joinExistingWorkspaces()

     /*
    const workspaces:EntryHashMap<Workspace> = await tsStore.joinExistingWorkspaces()

     
    await synStore.fetchCommitHistory()
    const allCommits = get(synStore.allCommits)
    let tips = Object.keys(allCommits).filter((commitHash) => {
      for (const commit of Object.values(allCommits)) {
        if (commit.previousCommitHashes.includes(commitHash)) {
          return false
        }
      }
      return true
    })     
    console.log("TIPS", tips)

    for (const [workspaceHash, workspace] of Object.entries(workspaces)) {
      if (workspace.scribe == store.myAgentPubKey()) {
        if (tips.includes(workspace.initialCommitHash)) {
          // this workspace of mine appears to be a tip, so recreate the workspace because in
          // the current version we can't re-join a workspace
          await tsStore.makeBoard(undefined, workspace.initialCommitHash)
          tips = tips.filter((hash) => hash != workspace.initialCommitHash)
        }
      }
    }

    

    // instatiate all uncreated tips so far
    for (const hash of tips) {
      await tsStore.makeBoard(undefined, hash)
    }*/
/*    if (get(tsStore.boards).length == 0) {
       console.log("NEW workspace AFTER UNABLE TO JOIN OR FIND EXISTING", synStore )
      await tsStore.makeBoard("New Board", await store.latestCommit())
    }*/
  });
  $: activeBoardIndex = tsStore ? tsStore.activeBoardIndex : undefined
  setContext('synStore', {
    getStore: () => synStore,
  });

  setContext('tsStore', {
    getStore: () => tsStore,
  });

  async function createStore() : Promise<TalkingStickiesStore> {
    const appId = process.env.SVELTE_APP_APP_ID ? process.env.SVELTE_APP_APP_ID : 'talking-stickies'

    const appPort = process.env.SVELTE_APP_APP_PORT ? process.env.SVELTE_APP_APP_PORT : 8888
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
    grid-column: 1/3;
    grid-row: 1/2;
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
  {:else}
    Loading
  {/if}
</div>