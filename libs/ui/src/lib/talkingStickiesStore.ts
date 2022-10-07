import type { CellClient } from '@holochain-open-dev/cell-client';
import type {
    EntryHash,
  } from '@holochain/client';
import type { AgentPubKeyB64, Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';
import { serializeHash, deserializeHash } from '@holochain-open-dev/utils';
import { WorkspaceStore, SynStore, stateFromCommit} from '@holochain-syn/store';
import { SynClient, type Workspace } from '@holochain-syn/client';
import type { TalkingStickiesDelta, TalkingStickiesGrammar, TalkingStickiesState } from './grammar';
import { talkingStickiesGrammar } from './grammar';
import type {Readable, Writable } from "svelte/store";
import { get, writable } from "svelte/store";
import { ArchivedBoard, Board, boardListGrammar, type BoardListDelta, type BoardListGrammar } from './board';
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
    boards: Writable<Dictionary<Board>> = writable({});
    archivedBoards: Writable<Dictionary<ArchivedBoard>> = writable({});
    activeBoardHash: Writable<EntryHashB64| undefined> = writable(undefined)
    boardList: WorkspaceStore<BoardListGrammar>;
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
                    if (workspace.name === "board-list") { // skip the board-list workspace
                        continue
                    }
                    
                    const hashB64 = serializeHash(workspaceHash)
                    const board = boards[hashB64]
                    if (!board) {
                        console.log("found board we don't have:", hashB64)
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
                        console.log(`ATTEMPTING TO JOIN ${workspace.name}: ${hashB64}`)
                        try {
                            const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar)
                            this.newBoard(workspaceStore)
                            if (this.createdBoards.findIndex((hash) => isEqual(hash, workspaceHash)) >= 0) {
                                // we created this board so activate it!
                                console.log("ACTIVATING:", hashB64)
                                this.activeBoardHash.update((n) => {return hashB64} )
                            }
                            console.log("joined workspace:", workspaceStore)
                        } catch (e) {
                            console.log(`Error while joining ${hashB64}`, e)
                        }
                    } else {
                        console.log("allready joined", hashB64)
                    }
                }
            } catch (e) {
                console.log("Error while updating board list: ",e)
            }
            this.updating = false
        })
    }

    async requestBoardChanges(hash: EntryHashB64, deltas: TalkingStickiesDelta[]) {
        const board = get(this.boards)[hash]
        if (board) {
            board.requestChanges(deltas)
        }
    }

    async requestBoardListChanges(deltas: BoardListDelta[]) {
        if (this.boardList) {
            this.boardList.requestChanges(deltas)
        }
    }

    async requestChange(deltas: TalkingStickiesDelta[]) {
        this.requestBoardChanges(get(this.activeBoardHash), deltas)
    }

    getReadableBoardState(hash: EntryHashB64 | undefined) : Readable<TalkingStickiesState> | undefined {
        console.log("getting board state", hash, this.boards[hash], this.boards )
        if (hash == undefined) return undefined
        return get(this.boards)[hash].workspace.state
    }

    setActiveBoard(hash: EntryHashB64) {
        const board = get(this.boards)[hash]
        if (board) {
            this.activeBoardHash.update((n) => {return hash} )
        } else {
            this.activeBoardHash.update((n) => {return undefined} )
        }
    }

    addArchivedBoard(workspaceHash:EntryHash, state:TalkingStickiesState) {
        this.archivedBoards.update((boards) => {
            boards[serializeHash(workspaceHash)] = new ArchivedBoard(state)
            return boards
        })
    }

    async archiveBoard(hash: EntryHashB64) {
        this.boardList.requestChanges([{type:"set-status", hash ,status:"archived"}])
        this.boards.update((boards)=> {
            delete boards[hash]
            return boards
        })
        if (get(this.activeBoardHash) == hash) {
            this.setActiveBoard(undefined)
        }
    }

    async unarchiveBoard(hash: EntryHashB64) {
        const workspaceHash = deserializeHash(hash)
        const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar)
        this.newBoard(workspaceStore)
        let changes : BoardListDelta[] = 
        [
            {type:"set-status", hash ,status:""}
        ]
        const boardCount = get(this.boardList.state).boards.length
        if (boardCount > 1) {
            changes.push({type:"set-index", hash , index: boardCount-1})
        }

        this.boardList.requestChanges(changes)
    }

    closeActiveBoard() {
        this.setActiveBoard(undefined)
    }

    async makeBoardList() {
        const root = await this.synStore.createRoot(boardListGrammar)
        const hash = root.initialCommitHash
        let meta = new Uint8Array
        meta[0] = 0
        const workspaceHash = await this.synStore.createWorkspace({name:`board-list`, meta }, hash)
        this.boardList = await this.synStore.joinWorkspace(workspaceHash, boardListGrammar);
    }

    async makeBoard(options: any, fromHash?: EntryHashB64) {
        let hash 
        if (fromHash) {
            hash = deserializeHash(fromHash)
         } else {
            const root = await this.synStore.createRoot(talkingStickiesGrammar)
            hash = root.initialCommitHash
         }
        let meta = new Uint8Array
        meta[0] = 1
        const workspaceHash = await this.synStore.createWorkspace({name:`${Date.now()}`, meta }, hash)
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

            this.boardList.requestChanges([{
                type: 'add-board',
                name: options.name ? options.name : "untitled",
                hash: serializeHash(workspaceHash),
                status: ""
            }])
        
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
            boards[serializeHash(board.hash())] = board 
            return boards
        })
        return board
    }

    async joinExistingWorkspaces() : Promise<any> {
        console.log("FETCHING ALL WORKSPACES")
        const workspaces = get(await this.synStore.fetchAllWorkspaces());
        if (!this.boardList) {
            workspaces.entries().forEach(async ([hash,workspace]) => {
                if (workspace.name === "board-list") {
                    console.log("Found a board-list, joining...")
                    this.boardList = await this.synStore.joinWorkspace(hash, boardListGrammar)
                    return
                }
            });
        if (!this.boardList) {
            await this.makeBoardList()
        }
        return workspaces
      }
    }
}