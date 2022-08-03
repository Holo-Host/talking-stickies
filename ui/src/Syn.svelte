<script lang="ts">
  import { store, scribeStr, session, folks } from './stores.js'
  import { createEventDispatcher, onMount } from 'svelte'
  import { bufferToBase64 } from './utils.js'
  import { HolochainClient } from '@holochain-open-dev/cell-client';
  import { deserializeHash } from '@holochain-open-dev/utils';
  import { AppWebsocket, InstalledCell } from '@holochain/client';
  import { TalkingStickiesStore } from './talkingStickiesStore';
  import { get } from "svelte/store";

  export let setAgentPubkey
  let talkingStickiesStore: TalkingStickiesStore


  // this is the list of sessions returned by the DNA
//  let sessions

  export function requestChange(deltas) {
    $store.requestChange(deltas)
  }
  const appId = 'talking-stickies'

  onMount(async () => {
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
    $store = new TalkingStickiesStore(
      client,
      talkingStickiesCell,
    );
    setAgentPubkey($store.myAgentPubKey())
    const sessions = await $store.synStore.getAllSessions()
    console.log("SESSIONS:", sessions)
    const sessionKeys = Object.keys(sessions)
    let sessionHash
    if (sessionKeys.length > 0) {
      sessionHash = sessionKeys[0]
    } {
      const sessionInfo = await $store.synStore.newSession();
      console.log("SESSION:", sessionInfo)
      sessionHash = sessionInfo.sessionHash
    }
    await $store.synStore.joinSession(sessionHash)
 /*    $connection = new Connection(appPort, appId)
    await $connection.open({ ...emptySession }, applyDeltaFn)

   session = $connection.syn.session

    console.log('joining session...')
    await $connection.joinSession()
    sessions = $connection.sessions*/
  })

  // -----------------------------------------------------------------------

  const dispatch = createEventDispatcher()

  let adminPort=1234

  let appPort=8888
  async function toggle() {
    console.log("NO TOGGLE")
       /*
   if (!$connection) {
      $connection = new Connection(appPort, appId)
      await $connection.open({ ...emptySession }, applyDeltaFn)

      session = $connection.syn.session

      console.log('joining session...')
      await $connection.joinSession()
      sessions = $connection.sessions
    }
    else {
      $connection.syn.clearState()
      sessions = undefined
      console.log('disconnected')
    }
    */
  }

  async function commitChange() {
    console.log("not implemented")
//    get (talkingStickiesStore.synStore.activeSession!).commitChange()
  }

  $: noscribe = $scribeStr === ''
</script>
<style>
  :global(.noscribe) {
  pointer-events: none;
  position: relative;
  }

  :global(.noscribe:after) {
  content: ' ';
  z-index: 20;
  display: block;
  position: absolute;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.7);
  }
  input {
    width: 4em;
    border-radius: 4px;
  }
  .session {
    border-radius: 4px;
    background-color: pink
  }
  button {
    cursor: pointer;
  }
</style>
<!-- <button class:noscribe on:click={commitChange}>Commit</button>

<div>
  <h4>Holochain Connection:</h4>
  App Port: <input bind:value={appPort}>
  AppId: <input bind:value={appId}>
  <button on:click={toggle}>
    {#if $connection}
      Disconnect
    {:else}
      Connect
    {/if}
  </button>
</div>

<div class='sessions'>
  Sessions:
  {#if sessions}
  {#each sessions as session}
    <span class='session'>
      Id: {bufferToBase64(session).slice(-4)}
    </span>
  {/each}
  {/if}
</div> -->
