import type { WeApplet } from '@lightningrodlabs/we-applet';
import { Controller, BoardType } from '@holo-host/boardz';
import { AppAgentWebsocket, AppWebsocket } from '@holochain/client';

const talkingStickies: WeApplet = {
 async appletRenderers(appWebsocket: AppWebsocket, adminWs, weServices, appletInfo) {

    console.log("appletInfo", appletInfo)
    console.log("appletInfo.cellInfo", appletInfo[0].appInfo.cell_info)
    const roleName = Object.keys(appletInfo[0].appInfo.cell_info)[0]
    console.log("roleName", roleName)

    console.log("appletInfo[0]", appletInfo[0])

    const appId = appletInfo[0].appInfo.installed_app_id
    const client = await AppAgentWebsocket.connect("", "")
    client.installedAppId = appId
    client.cachedAppInfo = undefined
    client.appWebsocket.overrideInstalledAppId = appId

    console.log("client", client)

    let controller : Controller

    return {
      full: (rootElement: HTMLElement, registry: CustomElementRegistry) => {
        const target = rootElement.attachShadow({ mode: 'open' });

        controller = new Controller({
          target,
          props: {
            roleName,
            boardType: BoardType.Stickies,
            client,
          }
        });
      },
      blocks: [],
    };
  },
};

export default talkingStickies;
