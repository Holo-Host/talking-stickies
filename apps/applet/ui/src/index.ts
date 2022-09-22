import type { WeApplet } from '@lightningrodlabs/we-applet';
import { Controller } from '@holo-host/talking-stickies';
import { HolochainClient } from '@holochain-open-dev/cell-client';
import type { AppWebsocket, InstalledCell } from '@holochain/client';

const talkingStickies: WeApplet = {
 async appletRenderers(appWebsocket: AppWebsocket, adminWs, weServices, appletInfo) {

  const talkingStickiesCell: InstalledCell = appletInfo[0].installedAppInfo.cell_data.find(
    c => c.role_id === 'talking-stickies'
  )!;

    const client = new HolochainClient(appWebsocket);
    let controller : Controller

    return {
      full: (rootElement: HTMLElement, registry: CustomElementRegistry) => {
        controller = new Controller({
          target: rootElement,
          props: {
            talkingStickiesCell,
            client,
          }
        });
      },
      blocks: [],
    };
  },
};

export default talkingStickies;
