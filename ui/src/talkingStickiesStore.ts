import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import type {
    InstalledCell,
  } from '@holochain/client';
import {
    AgentPubKeyB64,
    serializeHash,
  } from '@holochain-open-dev/core-types';
import { SynStore } from '@holochain-syn/store';
import { TalkingStickiesGrammar, talkingStickiesGrammar } from './grammar';

const ZOME_NAME = 'talking_stickies'

export class TalkingStickiesService {
    constructor(public cellClient: CellClient, public zomeName = ZOME_NAME) {}

    private callZome(fnName: string, payload: any) {
        return this.cellClient.callZome(this.zomeName, fnName, payload);
    }
}


export class TalkingStickiesStore {
    service: TalkingStickiesService;
    synStore: SynStore<TalkingStickiesGrammar>;
    cellClient: CellClient;
    myAgentPubKey(): AgentPubKeyB64 {
        return serializeHash(this.talkingStickiesCell.cell_id[1]);
    }
    
    constructor(
        protected client: HolochainClient,
        protected talkingStickiesCell: InstalledCell,
        zomeName: string = ZOME_NAME
    ) {
        this.cellClient = new CellClient(client, talkingStickiesCell)
        this.service = new TalkingStickiesService(
          this.cellClient,
          zomeName
        );
        // @ts-ignore
        this.synStore = new SynStore(this.cellClient, talkingStickiesGrammar)
    } 
}