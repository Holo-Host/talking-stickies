import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import type {
    InstalledCell,
  } from '@holochain/client';
import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { serializeHash } from '@holochain-open-dev/utils';
import { SessionStore, SynStore, unnest } from '@holochain-syn/store';
import { TalkingStickiesGrammar, talkingStickiesGrammar, TalkingStickiesState} from './grammar';
import { get, Readable, writable, Writable } from "svelte/store";
import type { Board } from './board';

const ZOME_NAME = 'talking_stickies'

export class TalkingStickiesService {
    constructor(public cellClient: CellClient, public zomeName = ZOME_NAME) {}

    private callZome(fnName: string, payload: any) {
        return this.cellClient.callZome(this.zomeName, fnName, payload);
    }
}


export class TalkingStickiesStore {
    service: TalkingStickiesService;
    boards: Writable<Array<Board>> = writable([]);
    activeBoard: Writable<Board|undefined> = writable(undefined);

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

    async requestChange(deltas) {
        console.log("REQUESTING CHANGES: ", deltas)
        get (this.synStore.activeSession!).requestChanges(deltas)
    }
    getActiveBoard() : Board | undefined {
        return get (this.activeBoard)
    }
    setActiveBoard(index: number) {
        const board = get(this.boards)[index]
        if (board) {
            this.activeBoard.update((b) => {
                console.log("Activating board: ", board.name, JSON.stringify(board.session))
                return board
            })
        }
    }
    makeBoard() {
        this.synStore.newSession().then(() =>{
            this.newBoard(`Board ${get(this.boards).length}`, get(this.synStore.activeSession))
        })
    }
    newBoard(name: string, session: SessionStore<TalkingStickiesGrammar>) {
        this.boards.update((boards)=> {
            const board = {name,commit:"", session}
            boards.push(board)
            this.activeBoard.update((b) => {return board})
            return boards
        })
    }

}