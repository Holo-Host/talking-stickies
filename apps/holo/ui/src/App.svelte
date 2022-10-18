<script lang="ts">
  // @ts-ignore
  import {Controller} from '@holo-host/talking-stickies'
  import { CellClient, HoloClient } from '@holochain-open-dev/cell-client';
  const appId = process.env.SVELTE_APP_APP_ID ? process.env.SVELTE_APP_APP_ID : 'talking-stickies'
  const appPort = process.env.SVELTE_APP_APP_PORT ? process.env.SVELTE_APP_APP_PORT : 8888
  import WebSdk from '@holo-host/web-sdk'
  import type { InstalledCell } from '@holochain/client';
  const url = `ws://localhost:${appPort}`;

  let websdkConnection: WebSdk
  let cellClient: CellClient  
  let agentState

  let connected = false
  initialize()

  async function initialize() : Promise<void> {
    websdkConnection = await WebSdk.connect({
      chaperoneUrl: process.env.SVELTE_APP_CHAPERONE_URL || 'http://localhost:24274',
      authFormCustomization: {
        publisherName: 'Holo',
        appName: 'TalkingStickies',
        requireRegistrationCode: false,
        anonymousAllowed: false,
      }
    })

    const appInfo = await websdkConnection.appInfo()

    const holoClient = new HoloClient(websdkConnection, appInfo)


    const installedCells = appInfo.cell_data;
    const talkingStickiesCell = installedCells.find(
      c => c.role_id === 'talking-stickies'
    ) as InstalledCell;

    cellClient = new CellClient(holoClient, talkingStickiesCell)

    agentState = websdkConnection.agent
    websdkConnection.on('agent-state', newAgentState => {
      agentState = newAgentState
    })
  }
  
  $: console.log('^&* Agent State', agentState)
  $: connected = agentState && (!agentState.isAnonymous && agentState.isAvailable)
  $: if (!connected && websdkConnection) {
    console.log('^&* Showing Signup Screen')
    websdkConnection.signUp({ cancellable: false })
  }

  const handleLogout = () => websdkConnection.signOut()

</script>

<style>
:global(body) {
  font-family: Roboto,'Open Sans','Helvetica Neue',sans-serif;
	}
</style>

<svelte:head>
</svelte:head>
{#if connected}
  <button on:click={handleLogout}>Logout</button>
  <Controller client={cellClient}></Controller>
{:else}
  Loading
{/if}