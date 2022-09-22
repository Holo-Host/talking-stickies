<script lang="ts">
  import {Controller} from '@holo-host/talking-stickies'
  import { HolochainClient } from '@holochain-open-dev/cell-client';
  const appId = process.env.SVELTE_APP_APP_ID ? process.env.SVELTE_APP_APP_ID : 'talking-stickies'
  const appPort = process.env.SVELTE_APP_APP_PORT ? process.env.SVELTE_APP_APP_PORT : 8888
  import { AppWebsocket, InstalledCell, type InstalledAppInfo } from '@holochain/client';
  const url = `ws://localhost:${appPort}`;

  let talkingStickiesCell: InstalledCell
  let client : HolochainClient

  console.log("CLIENT: ", client);
  let connected = false
  initialize()

  async function initialize() : Promise<void> {
    console.log("appPort is", appPort)
    const appWebsocket = await AppWebsocket.connect(url);
    
    console.log('Connecting with', appPort, appId)
    client = new HolochainClient(appWebsocket);
    
    const appInfo = await client.appWebsocket.appInfo({
      installed_app_id: appId,
    });
    const installedCells = appInfo.cell_data;
    talkingStickiesCell = installedCells.find(
        c => c.role_id === 'talking-stickies'
      ) as InstalledCell;

    connected = true
  }
</script>

<style>
</style>

<svelte:head>
</svelte:head>
{#if connected}
  <Controller talkingStickiesCell={talkingStickiesCell} client={client}></Controller>
{:else}
  Loading
{/if}