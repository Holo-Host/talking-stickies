import type { WeApplet } from '@lightningrodlabs/we-applet';
import { Controller, BoardType } from '@holo-host/boardz';
import { AppAgentWebsocket, AppWebsocket } from '@holochain/client';

const kando: WeApplet = {
 async appletRenderers(appWebsocket: AppWebsocket, adminWs, weServices, appletInfo) {

    const client = await AppAgentWebsocket.connect("", appletInfo[0].appInfo.installed_app_id)
    console.log("appletInfo", appletInfo)
    console.log("appletInfo.cellInfo", appletInfo[0].appInfo.cell_info)
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
