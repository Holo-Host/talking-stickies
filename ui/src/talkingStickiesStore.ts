import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import type {
    InstalledCell,
  } from '@holochain/client';
import type { AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import { serializeHash } from '@holochain-open-dev/utils';
import { SessionStore, SynStore, unnest } from '@holochain-syn/store';
import { TalkingStickiesGrammar, talkingStickiesGrammar, TalkingStickiesState} from './grammar';
import { get, writable, Writable } from "svelte/store";
import { Board } from './board';

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
    activeBoardIndex: Writable<number|undefined> = writable(undefined)

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

    async requestBoardChanges(index, deltas) {
        console.log("REQUESTING CHANGES: ", deltas)
        const board = get(this.boards)[index]
        if (board) {
            board.requestChanges(deltas)
        }
    }

    async requestChange(deltas) {
        this.requestBoardChanges(get(this.activeBoardIndex), deltas)
    }
    getActiveBoard() : Board | undefined {
        return get (this.activeBoard)
    }
    setActiveBoard(index: number) {
        const board = get(this.boards)[index]
        if (board) {
            this.activeBoardIndex.update((n) => {return index} )
            this.activeBoard.update((b) => {
                console.log("Activating board: ", board.name, JSON.stringify(board.session))
                return board
            })
        } else {
            this.activeBoard.update(() => {return undefined})
            this.activeBoardIndex.update((n) => {return undefined} )
        }
    }

    deleteBoard(index: number) {
        const board = get(this.boards)[index]
        if (board) {
            board.close()
            this.boards.update((boards)=> {
                boards.splice(index,1)
                return boards
            })
            this.setActiveBoard(-1)
        }
    }
    closeActiveBoard() {
        this.deleteBoard(get(this.activeBoardIndex))
    }
    async makeBoard(name: string) {
        await this.synStore.fetchCommitHistory()
        let latest = 0
        let latestHash = undefined
        const commits = Object.entries(get(this.synStore.allCommits))
        commits.forEach(([hash, commit]) => {
            console.log("COMMIT", commit)
            const state = this.synStore.fetchSnapshot(commit.newContentHash)
            console.log("CONTENT STATE:", get(this.synStore.snapshots)[commit.newContentHash])
            if (commit.createdAt > latest) {
                latest = commit.createdAt; latestHash = hash    
            }
        })

        const session = await this.synStore.newSession(latestHash)
        session.requestChanges([{
            type: "set-name",
            name
          }])

        this.newBoard(session)
    
    }
    newBoard(session: SessionStore<TalkingStickiesGrammar>) {
        this.boards.update((boards)=> {
            const board = new Board(session)
            boards.push(board)
            this.activeBoard.update((b) => {return board})
            this.activeBoardIndex.update((n) => {return boards.length-1} )
            return boards
        })
    }

}