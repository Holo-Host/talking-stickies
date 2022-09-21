import { WeApplet } from '@lightningrodlabs/we-applet';
import { Controller } from '@holo-host/talking-stickies';
import { HolochainClient } from '@holochain-open-dev/cell-client';
import { AppWebsocket, DnaHash } from '@holochain/client';

const talkingStickies: WeApplet = {
 async appletRenderers(appWebsocket: AppWebsocket, adminWs, weServices, appletInfo) {

    const client = new HolochainClient(appWebsocket);
    let controller : Controller

    return {
      full: (rootElement: HTMLElement, registry: CustomElementRegistry) => {
        controller = new Controller({
          target: rootElement,
          props: {
            appWebsocket,
            appInfo: appletInfo,
            client,
          }
        });
      },
      blocks: [],
    };
  },
};

export default talkingStickies;
