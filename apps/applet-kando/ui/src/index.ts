import type { WeApplet } from '@lightningrodlabs/we-applet';
import { Controller, BoardType } from '@holo-host/boardz';
import { AppAgentWebsocket, AppWebsocket } from '@holochain/client';

const kando: WeApplet = {
  async appletRenderers(appWebsocket: AppWebsocket, adminWs, weServices, appletInfo) {

    const appId = appletInfo[0].appInfo.installed_app_id
    const client = await AppAgentWebsocket.connect("", "")
    client.installedAppId = appId
    client.cachedAppInfo = undefined
    client.appWebsocket.overrideInstalledAppId = appId
    const roleName = Object.keys(appletInfo[0].appInfo.cell_info)[0]
    console.log("roleName", roleName)
    let controller : Controller

    return {
      full: (rootElement: HTMLElement, registry: CustomElementRegistry) => {
        const target = rootElement.attachShadow({ mode: 'open' });

        controller = new Controller({
          target,
          props: {
            roleName,
            boardType: BoardType.KanDo,
            client,
          }
        });
      },
      blocks: [],
    };
  },
};

export default kando;
