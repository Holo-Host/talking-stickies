import {
  AdminWebsocket,
  AppWebsocket,
  InstalledAppInfo,
  InstalledCell,
} from "@holochain/client";
import {
  WeApplet,
  AppletRenderers,
  WeServices,
} from "@lightningrodlabs/we-applet";

//import { TalkingStickiesApplet } from "./talking_stickies-applet";

import App from './src/App.svelte'

const talking_stickiesApplet: WeApplet = {
  async appletRenderers(
    appWebsocket: AppWebsocket,
    adminWebsocket: AdminWebsocket,
    weServices: WeServices,
    appletAppInfo: InstalledAppInfo
  ): Promise<AppletRenderers> {
    return {
      full(element: HTMLElement, registry: CustomElementRegistry) {
        registry.define("talking_stickies-applet", App);
        element.innerHTML = `<talking_stickies-applet></talking_stickies-applet>`;
        const appletElement = element.querySelector("talking_stickies-applet") as any;
        const app = new App({
          target: appletElement,
          props: {
          }
        });

        appletElement.appWebsocket =  appWebsocket;
        appletElement.profilesStore = weServices.profilesStore;
        appletElement.appletAppInfo = appletAppInfo;
      },
      blocks: [],
    };
  },
};

export default talking_stickiesApplet;
