import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import type {
    InstalledCell,
  } from '@holochain/client';
import type { AgentPubKeyB64, EntryHashB64 } from '@holochain-open-dev/core-types';
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
    async latestCommit() : Promise<EntryHashB64|undefined> {
        await this.synStore.fetchCommitHistory()
        let latest = 0
        let latestHash = undefined
        const commits = Object.entries(get(this.synStore.allCommits))
        commits.forEach(async ([hash, commit]) => {
            console.log("COMMIT", commit)
            await this.synStore.fetchSnapshot(commit.newContentHash)
            console.log("CONTENT STATE:", get(this.synStore.snapshots)[commit.newContentHash])
            if (commit.createdAt > latest) {
                latest = commit.createdAt; latestHash = hash    
            }
        })
        return latestHash
    }
    async makeBoard(name: string|undefined, fromHash?: EntryHashB64) {
        const session = await this.synStore.newSession(fromHash)
        if (name !== undefined) {
            session.requestChanges([{
                type: "set-name",
                name
            }])
        }

        const board = this.newBoard(session)
        this.activeBoard.update((b) => {return board})
        this.activeBoardIndex.update((n) => {return get(this.boards).length-1} )
    }
    newBoard(session: SessionStore<TalkingStickiesGrammar>) : Board {
        const board = new Board(session)
        this.boards.update((boards)=> {
            boards.push(board)
            return boards
        })
        return board
    }
    async joinExistingSessions() : Promise<any> {
        const sessions = await this.synStore.getAllSessions();
        const allreadyJoined = get(this.synStore.joinedSessions)
    
        console.log(`ALL SESSIONS (${Object.keys(sessions).length})`, sessions)
        // Try and join other people's sessions
        let promises = []
    
        for (const [sessionHash, session] of Object.entries(sessions)) {
          if (session.scribe !== this.myAgentPubKey() && !allreadyJoined.includes(sessionHash) ) {
            console.log(`ATTEMPTING TO JOIN ${sessionHash}`)
            promises.push(this.synStore.joinSession(Object.keys(sessions)[0]))
          }
        }
        await Promise.allSettled(promises).
          then((results) => results.forEach((result) => {
            if (result.status === "rejected") {
              console.log("unable to join session:", result.reason)
            } else if (result.status === "fulfilled") {
              console.log("joined session:", result.value)
              this.newBoard(result.value)
            }
          }));
        return sessions
      }
}