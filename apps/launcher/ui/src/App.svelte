<script lang="ts">
  import {Controller, BoardType} from '@holo-host/boardz'
  import { AppAgentWebsocket, AdminWebsocket } from '@holochain/client';

  const appId = process.env.SVELTE_APP_APP_ID ? process.env.SVELTE_APP_APP_ID : 'talking-stickies'
  const roleName = 'talking-stickies'
  const appPort = process.env.SVELTE_APP_APP_PORT ? process.env.SVELTE_APP_APP_PORT : 8888
  const adminPort = process.env.SVELTE_APP_ADMIN_PORT
  const url = `ws://localhost:${appPort}`;

  let client: AppAgentWebsocket  

  let connected = false
  initialize()

  async function initialize() : Promise<void> {
    console.log("adminPort is", adminPort)
    if (adminPort) {
      const adminWebsocket = await AdminWebsocket.connect(`ws://localhost:${adminPort}`)
      const x = await adminWebsocket.listApps({})
      console.log("apps", x)
      const cellIds = await adminWebsocket.listCellIds()
      console.log("CELL IDS",cellIds)
      await adminWebsocket.authorizeSigningCredentials(cellIds[0])
    }
    console.log("appPort and Id is", appPort, appId)
    client = await AppAgentWebsocket.connect(url, appId)

    connected = true
  }
</script>

<svelte:head>
</svelte:head>
{#if connected}
  <Controller client={client} boardType={BoardType.Stickies} roleName={roleName}></Controller>
{:else}
  Connecting...
{/if}

<style>
  :global(body) {
    font-family: Roboto,'Open Sans','Helvetica Neue',sans-serif;
  }
</style>