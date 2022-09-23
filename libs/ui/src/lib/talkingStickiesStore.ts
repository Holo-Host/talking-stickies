import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client';
import type {
    Entry,
    EntryHash,
    InstalledCell,
  } from '@holochain/client';
import type { AgentPubKeyB64, Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';
import { serializeHash, deserializeHash } from '@holochain-open-dev/utils';
import { WorkspaceStore, SynStore} from '@holochain-syn/store';
import { SynClient } from '@holochain-syn/client';
import { TalkingStickiesGrammar, talkingStickiesGrammar, TalkingStickiesState} from './grammar';
import { get, Readable, writable, Writable } from "svelte/store";
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

    deleteBoard(index: number) {
        const board = get(this.boards)[index]
        if (board) {
            board.requestChanges([{type:"set-status",status:"archived"}])
            this.addArchivedBoard(board.workspace.workspaceHash, board.state())
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

        const board = this.newBoard(workspaceStore)
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
            if (changes.length > 0)
                board.requestChanges(changes)
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
            console.log(`ATTEMPTING TO JOIN ${workspace.name}: ${serializeHash(workspaceHash)}`)
            const workspaceStore = await this.synStore.joinWorkspace(workspaceHash, talkingStickiesGrammar)
            const state = get(workspaceStore.state)
            console.log("joined workspace:", workspaceStore, state)
            const boards = get(this.boards)
            const boardIndex = boards.findIndex((board) => isEqual(board.workspace.workspaceHash, workspaceHash))
            if (boardIndex < 0) {
                if (state.status == "archived") {
                    this.addArchivedBoard(workspaceHash, state)
                    workspaceStore.leaveWorkspace()
                } else {
                    this.newBoard(workspaceStore)
                }
            } else {
                // if for some reason the board was archived and we have it in our active list remove it.
                if (state.status == "archived")  {
                    this.deleteBoard(boardIndex)
                }
            }
        }
        return workspaces
      }
}