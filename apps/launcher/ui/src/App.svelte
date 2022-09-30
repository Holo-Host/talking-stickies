<script lang="ts">
  import {Controller} from '@holo-host/talking-stickies'
  import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
  const appId = process.env.SVELTE_APP_APP_ID ? process.env.SVELTE_APP_APP_ID : 'talking-stickies'
  const appPort = process.env.SVELTE_APP_APP_PORT ? process.env.SVELTE_APP_APP_PORT : 8888
  import { AppWebsocket, InstalledCell, type InstalledAppInfo } from '@holochain/client';
  const url = `ws://localhost:${appPort}`;

  let cellClient: CellClient  

  let connected = false
  initialize()

  async function initialize() : Promise<void> {
    console.log("appPort is", appPort)
    const appWebsocket = await AppWebsocket.connect(url);
    
    console.log('Connecting with', appPort, appId)
    const holochainClient = new HolochainClient(appWebsocket);
    
    const appInfo = await holochainClient.appWebsocket.appInfo({
      installed_app_id: appId,
    });
    const installedCells = appInfo.cell_data;
    const talkingStickiesCell = installedCells.find(
        c => c.role_id === 'talking-stickies'
      ) as InstalledCell;

    cellClient = new CellClient(holochainClient, talkingStickiesCell)

    connected = true
  }
</script>

<style>
:global(body) {
  font-family: Roboto,'Open Sans','Helvetica Neue',sans-serif;
	}
</style>

<svelte:head>
</svelte:head>
{#if connected}
  <Controller client={cellClient}></Controller>
{:else}
  Loading
{/if}