<script lang="ts">
  import {Controller} from '@holo-host/talking-stickies'
  const appId = process.env.SVELTE_APP_APP_ID ? process.env.SVELTE_APP_APP_ID : 'talking-stickies'
  const appPort = process.env.SVELTE_APP_APP_PORT ? process.env.SVELTE_APP_APP_PORT : 8888
  import { AppAgentWebsocket, AppWebsocket } from '@holochain/client';
  const url = `ws://localhost:${appPort}`;

  let client: AppAgentWebsocket  

  let connected = false
  initialize()

  async function initialize() : Promise<void> {
    console.log("appPort is", appPort)
    const appWebsocket = await AppWebsocket.connect(url);
    client = await AppAgentWebsocket.connect(appWebsocket, 'talking-stickies')

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
  <Controller client={client}></Controller>
{:else}
  Loading
{/if}