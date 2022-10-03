import type { CellClient } from '@holochain-open-dev/cell-client';
import type {
    EntryHash,
  } from '@holochain/client';
import type { AgentPubKeyB64, Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';
import { serializeHash, deserializeHash } from '@holochain-open-dev/utils';
import { WorkspaceStore, SynStore, stateFromCommit} from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import type { TalkingStickiesGrammar, TalkingStickiesState } from './grammar';
import { talkingStickiesGrammar } from './grammar';
import type {Readable, Writable } from "svelte/store";
import { get, writable } from "svelte/store";
import { ArchivedBoard, Board } from './board';
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
    archivedBoards: Writable<Dictionary<ArchivedBoard>> = writable({});
    activeBoardIndex: Writable<number|undefined> = writable(undefined)
    createdBoards: Array<EntryHash> = []
    ticklers = []
    updating = false
    synStore: SynStore;
    cellClient: CellClient;
    myAgentPubKey(): AgentPubKeyB64 {
        return serializeHash(this.cellClient.cell.cell_id[1]);
    }

    constructor(
        protected cellClientIn: CellClient,
        zomeName: string = ZOME_NAME
    ) {
        this.cellClient = cellClientIn
        this.service = new TalkingStickiesService(
          this.cellClient,
          zomeName
        );
        //@ts-ignore
        this.synStore = new SynStore(new SynClient(this.cellClient))
        this.synStore.knownWorkspaces.subscribe( async (workspaces) => {
            if (this.updating) {
                console.log(`${workspaces.keys().length} WORKSPACES FOUND but allready updating`, workspaces)
                return
            }
            this.updating = true
            try {
                console.log(`${workspaces.keys().length} WORKSPACES FOUND`, workspaces)
                const boards = get(this.boards)

                for (const [workspaceHash, workspace] of workspaces.entries()) {
                    const boardIndex = boards.findIndex((board) => isEqual(board.hash(), workspaceHash))
                    if (boardIndex < 0) {
                        console.log("found board we don't have")
                        const getWorkspaceTip = await this.synStore.client.getWorkspaceTip(workspaceHash)
                        const commit = await this.synStore.client.getCommit(getWorkspaceTip)
                        if (commit) {
                            const state: TalkingStickiesState = stateFromCommit(commit) as TalkingStickiesState
                            if (state.status == "archived") {
                                this.addArchivedBoard(workspaceHash, state)
                                console.log("added archived workspace:", state)
                                continue
                            }    
                        }    
                        const hashB64 = serializeHash(workspaceHash)
                        console.log(`ATTEMPTING TO JOIN ${workspace.name}: ${hashB64}`)
                        try {
                            const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar)
                            this.newBoard(workspaceStore)
                            if (this.createdBoards.findIndex((hash) => isEqual(hash, workspaceHash)) >= 0) {
                                // we created this board so activate it!
                                console.log("ACTIVATING:", get(this.boards).length-1)
                                this.activeBoardIndex.update((n) => {return get(this.boards).length-1} )
                            }
                            console.log("joined workspace:", workspaceStore)
                        } catch (e) {
                            console.log(`Error while joining ${hashB64}`, e)
                        }
                    } else {
                        console.log("allready joined")
                    }
                }
            } catch (e) {
                console.log("Error while updating board list: ",e)
            }
            this.updating = false
        })
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
    getReadableBoardState(index: number | undefined) : Readable<TalkingStickiesState> | undefined {
        console.log("getting board state", index, this.boards[index], this.boards )
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

    addArchivedBoard(workspaceHash:EntryHash, state:TalkingStickiesState) {
        this.archivedBoards.update((boards) => {
            boards[serializeHash(workspaceHash)] = new ArchivedBoard(state)
            return boards
        })
    }

    async unarchiveBoard(hash: string) {
        const workspaceHash = deserializeHash(hash)
        const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar)
        const board = this.newBoard(workspaceStore)
        board.requestChanges([{type:"set-status",status:""}])
        this.archivedBoards.update((boards) => {
            delete boards[hash]
            return boards
        })
    }

    async deleteBoard(index: number) {
        const board = get(this.boards)[index]
        if (board) {
            await board.requestChanges([{type:"set-status",status:"archived"}])
            this.addArchivedBoard(board.hash(), board.state())
            //board.close()
            this.boards.update((boards)=> {
                boards.splice(index,1)
                return boards
            })
            if (get(this.activeBoardIndex) == index) {
                this.setActiveBoard(-1)
            }
        }
    }
    closeActiveBoard() {
        this.setActiveBoard(-1)
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
    async makeBoard(options: any, fromHash?: EntryHashB64) {
        let hash 
        if (fromHash) {
            hash = deserializeHash(fromHash)
         } else {
            const root = await this.synStore.createRoot(talkingStickiesGrammar)
            hash = root.initialCommitHash
         }
        const workspaceHash = await this.synStore.createWorkspace({name:`${Date.now()}`, meta: undefined}, hash)
        const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar);

        // we don't create the board here because we want the same board creation code to run when a
        // new workspace  notification comes from a signal from someone else, so we have to distinguis this
        // my just caching the workspaces that we created.
        this.createdBoards.push(workspaceHash)
        if (options !== undefined) {
            let changes = []
            if (options.name) {
                changes.push({
                    type: "set-name",
                    name: options.name
                })
            }
            if (options.groups) {
                changes.push({
                    type: "set-groups",
                    groups: options.groups
                })
            }
            if (options.stickies) {
                options.stickies.forEach((sticky)=>{
                    changes.push({
                        type: "add-sticky",
                        value: sticky
                    })
                        
                })
            }
            if (options.voteTypes) {
                changes.push({
                    type: "set-vote-types",
                    voteTypes: options.voteTypes
                })
            }
            if (changes.length > 0) {
                workspaceStore.requestChanges(changes)
                await workspaceStore.commitChanges()
            }
        }
    }
    addTickler(fn) {
        this.ticklers.push(fn)
    }
    newBoard(workspace: WorkspaceStore<TalkingStickiesGrammar>): Board{
        const board = new Board(workspace)
        board.name.subscribe( (val) => {
            this.ticklers.forEach((fn)=>fn(board, val))
        })
        this.boards.update((boards)=> {
            boards.push(board)
            return boards
        })
        return board
    }

    async joinExistingWorkspaces() : Promise<any> {
        console.log("FETCHING ALL WORKSPACES")
        const workspaces = get(await this.synStore.fetchAllWorkspaces());
        return workspaces
      }
}