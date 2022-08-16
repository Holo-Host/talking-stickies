import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import type {
    InstalledCell,
  } from '@holochain/client';
import type { AgentPubKeyB64, Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';
import { serializeHash, deserializeHash } from '@holochain-open-dev/utils';
import { WorkspaceStore, SynStore, unnest} from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import { TalkingStickiesGrammar, talkingStickiesGrammar, TalkingStickiesState} from './grammar';
import { get, Readable, writable, Writable } from "svelte/store";
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

    synStore: SynStore;
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
        //@ts-ignore
        this.synStore = new SynStore(new SynClient(this.cellClient))
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
                console.log("Activating board: ", board.name, JSON.stringify(board.workspace))
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
        await this.synStore.fetchAllCommits()
        let latest = 0
        let latestHash = undefined
        const commits = Object.entries(get(this.synStore.knownCommits))
        commits.forEach(async ([hash, commit]) => {
            console.log("COMMIT", commit)
            //await this.synStore.fetchSnapshot(commit.newContentHash)
            //console.log("CONTENT STATE:", get(this.synStore.snapshots)[commit.newContentHash])
            if (commit.createdAt > latest) {
                latest = commit.createdAt; latestHash = hash    
            }
        })
        return latestHash
    }
    async makeBoard(name: string|undefined, fromHash?: EntryHashB64) {
        let hash 
        if (fromHash) {
            hash = deserializeHash(fromHash)
         } else {
            const root = await this.synStore.createRoot(talkingStickiesGrammar)
            hash = root.initialCommitHash
         }
        const workspaceHash = await this.synStore.createWorkspace({name:"fish", meta: undefined}, hash)
        const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar);
        if (name !== undefined) {
            workspaceStore.requestChanges([{
                type: "set-name",
                name
            }])
        }

        const board = this.newBoard(workspaceStore)
        this.activeBoard.update((b) => {return board})
        this.activeBoardIndex.update((n) => {return get(this.boards).length-1} )
    }
    newBoard(workspace: WorkspaceStore<TalkingStickiesGrammar>) : Board {
        const board = new Board(workspace)
        this.boards.update((boards)=> {
            boards.push(board)
            return boards
        })
        return board
    }
    async joinExistingWorkspaces() : Promise<any> {
        const workspaces = await this.synStore.fetchAllWorkspaces();
    
        console.log(`ALL WORKSPACES (${Object.keys(workspaces).length})`, workspaces)
        // Try and join other people's workspace
        let promises = []
    
        for (const [workspaceHash, workspace] of Object.entries(workspaces)) {
       //   if (workspace.scribe !== this.myAgentPubKey() && !allreadyJoined.includes(workspaceHash) ) {
            console.log(`ATTEMPTING TO JOIN ${workspaceHash}`)
            promises.push(this.synStore.joinWorkspace(deserializeHash(Object.keys(workspace)[0]), talkingStickiesGrammar))
        //  }
        }
        await Promise.allSettled(promises).
          then((results) => results.forEach((result) => {
            if (result.status === "rejected") {
              console.log("unable to join workspace:", result.reason)
            } else if (result.status === "fulfilled") {
              console.log("joined workspace:", result.value)
              this.newBoard(result.value)
            }
          }));
        return workspaces
      }
}