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
import {isEqual} from "lodash"

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
        const board = get(this.boards)[index]
        if (board) {
            board.requestChanges(deltas)
        }
    }

    async requestChange(deltas) {
        this.requestBoardChanges(get(this.activeBoardIndex), deltas)
    }
    getBoardState(index: number | undefined) : Readable<TalkingStickiesState> | undefined {
        if (index == undefined) return undefined
        return get(this.boards)[index].workspace.state
    }
    setActiveBoard(index: number) {
        const board = get(this.boards)[index]
        if (board) {
            this.activeBoardIndex.update((n) => {return index} )
        } else {
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
        const workspaceHash = await this.synStore.createWorkspace({name:`${Date.now()}`, meta: undefined}, hash)
        const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar);

        const board = this.newBoard(workspaceStore)
        if (name !== undefined) {
            board.requestChanges([{
                type: "set-name",
                name
            }])
        }
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
        const workspaces = get(await this.synStore.fetchAllWorkspaces());
    
        console.log(`${workspaces.keys().length} WORKSPACES FOUND`, workspaces)    
        for (const [workspaceHash, workspace] of workspaces.entries()) {
            console.log(`ATTEMPTING TO JOIN ${serializeHash(workspaceHash)}`)
            const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar)
            console.log("joined workspace:", workspaceStore)
            const board = get(this.boards).find((board) => isEqual(board.workspace.workspaceHash, workspaceHash))
            if (!board) {
                this.newBoard(workspaceStore)
            }
        }
        return workspaces
      }
}