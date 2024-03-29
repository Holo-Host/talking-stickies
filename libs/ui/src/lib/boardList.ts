import { RootStore, type Commit, type SynGrammar, type SynStore, type Workspace, type WorkspaceStore } from "@holochain-syn/core";
import type { Dictionary } from "@holochain-open-dev/core-types";
import { Board, BoardType, CommitTypeBoard, UngroupedId } from "./board";
import type { EntryHashMap, EntryRecord } from "@holochain-open-dev/utils";
import { derived, get, writable, type Readable, type Writable } from "svelte/store";
import { boardGrammar, type BoardDelta, type BoardGrammar, type BoardState } from "./board";
import { type AgentPubKey, type EntryHash, decodeHashFromBase64, type EntryHashB64, type AgentPubKeyB64, encodeHashToBase64 } from "@holochain/client";
import {toPromise} from '@holochain-open-dev/stores'

export const CommitTypeBoardList :string = "board-list"

export interface BoardRecord {
    hash: EntryHashB64
    name: string
    status: string
}

export interface Avatar {
    name: string
    url: string
}

export interface BoardListState {
    avatars: Dictionary<Avatar>;
    boards: BoardRecord[];
    agentBoards: Dictionary<Array<EntryHashB64>>;
}


export type BoardListDelta =
  | {
    type: "add-board";
    hash: EntryHashB64;
    name: string;
    status?: string;
  }
  | {
    type: "set-avatar";
    pubKey: AgentPubKeyB64;
    avatar: Avatar;
  }
  | {
    type: "set-name";
    hash: EntryHashB64;
    name: string;
  }
  | {
    type: "set-status";
    hash: EntryHashB64;
    status: string;
  }
  | {
    type: "set-index";
    hash: EntryHashB64;
    index: number;
  }
//   | {
//     type: "set-agent-board";
//     hash: EntryHashB64;
//     agent: AgentPubKeyB64;
//     state: boolean;
//   }
  ;

export type BoardListGrammar = SynGrammar<
BoardListDelta,
BoardListState
>;

export const boardListGrammar: BoardListGrammar = {
    initState(state)  {
        state.avatars = {}
        state.boards = []
        state.agentBoards = {}
    },
    applyDelta( 
        delta: BoardListDelta,
        state: BoardListState,
        _ephemeralState: any,
        _author: AgentPubKey
      ) {
        if (delta.type == "add-board") {
            const record: BoardRecord = {
                name: delta.name,
                hash: delta.hash,
                status: delta.status,
            }
            state.boards.unshift(record)
        }
        if (delta.type == "set-name") {
            state.boards.forEach((board, i) => {
                if (board.hash === delta.hash) {
                  state.boards[i].name = delta.name;
                }
            });
        }
        if (delta.type == "set-avatar") {
            state.avatars[delta.pubKey] = delta.avatar
        }
        if (delta.type == "set-status") {
            state.boards.forEach((board, i) => {
                if (board.hash === delta.hash) {
                  state.boards[i].status = delta.status;
                }
            });
        }
        if (delta.type == "set-index") {
            const index = state.boards.findIndex((board) => board.hash == delta.hash)
            if (index >= 0) {
              const c = state.boards[index]
              state.boards.splice(index,1)
              state.boards.splice(index, 0, c)
            }
        }
        // if (delta.type == "set-agent-board") {
        //     if (delta.state) {
        //         if (state.agentBoards[delta.agent] === undefined) {
        //             state.agentBoards[delta.agent] = [delta.hash]
        //         } else {
        //             const index = state.agentBoards[delta.agent].findIndex((hash) => hash === delta.hash)
        //             if (index == -1) {
        //                 state.agentBoards[delta.agent].push(delta.hash)
        //             }
        //         }
        //     } else {
        //         if (state.agentBoards[delta.agent] !== undefined) {
        //             const index = state.agentBoards[delta.agent].findIndex((hash) => hash === delta.hash)
        //             if (index >= 0) {
        //                 state.boards.splice(index,1)
        //             }
        //         }
        //     }             
        // }
      }
    }


export class BoardList {
    public workspace: WorkspaceStore<BoardListGrammar>
    public boards: Dictionary<Board>
    activeBoardHash: Writable<EntryHashB64| undefined> = writable(undefined)
    activeBoardType: Writable<BoardType| undefined> = writable(undefined)

    constructor(public rootStore: RootStore<BoardListGrammar>, public boardsRootStore: RootStore<BoardGrammar>) {
        this.boards = {}
    }

    public static async Create(synStore: SynStore) {
        const rootStore = await synStore.createDeterministicRoot(boardListGrammar, {type: CommitTypeBoardList})
        const boardsRootStore = await synStore.createDeterministicRoot(boardGrammar, {type: CommitTypeBoard})
        const me = new BoardList(rootStore, boardsRootStore);
        const workspaceHash = await rootStore.createWorkspace(
            'main',
            rootStore.root.entryHash
           );
        me.workspace = await rootStore.joinWorkspace(workspaceHash)
        return me
    }
    public static async Join(synStore: SynStore, rootCommit: EntryRecord<Commit>, boardsRootCommit: EntryRecord<Commit>) {
        const rootStore = new RootStore(
            synStore,
            boardListGrammar,
            rootCommit
          );
          const boardsRootStore = new RootStore(
            synStore,
            boardGrammar,
            boardsRootCommit
          );
        const me = new BoardList(rootStore, boardsRootStore);
        console.log("BoardList", me)
        const workspaces = await toPromise(rootStore.allWorkspaces);
        console.log("Workspaxces", workspaces)

        // if there is no workspace then we have a problem!!
        for (let i=0;i<workspaces.length;i+=1) {
            try {
                me.workspace = await rootStore.joinWorkspace(workspaces[0].entryHash);
                return me
            } catch(e) {
                console.log("failed to join workspace ",i, "with error",e, " trying next")
            }
        }
        throw("failed to join any workspace")
    }
    hash() : EntryHash {
        return this.rootStore.root.entryHash
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    stateStore() {
        return this.workspace.state
    }
    state() {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<BoardListDelta>) {
        console.log("REQUESTING BOARDLIST CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    avatars() {
        console.log("AVATARS: ",get(this.workspace.state))
        return derived(this.workspace.state, state => state.avatars)
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }

    async requestBoardChanges(hash: EntryHashB64, deltas: BoardDelta[]) {
        const board = await this.getBoard(hash)
        if (board) {
            board.requestChanges(deltas)
        }
    }

    async requestAtiveBoardChanges(deltas: BoardDelta[]) {
        this.requestBoardChanges(get(this.activeBoardHash), deltas)
    }

    getReadableBoardState(hash: EntryHashB64 | undefined) : Readable<BoardState> | undefined {
        if (hash == undefined) return undefined
        return this.boards[hash].workspace.state
    }
    
    async getBoard(hash: EntryHashB64) : Promise<Board | undefined> {
        let board = this.boards[hash]
        if (!board) {
            const workspaceHash = decodeHashFromBase64(hash)
            board = this.boards[hash] = new Board(await this.boardsRootStore.joinWorkspace(workspaceHash));
        }
        return board
    }

    async setActiveBoard(hash: EntryHashB64 | undefined) {
        let board
        if (hash) {
            board = await this.getBoard(hash)
            if (board) {
                // const myPubKey = encodeHashToBase64(this.rootStore.synStore.client.client.myPubKey)
                // const myBoards = this.state().agentBoards[myPubKey]
                // if (myBoards  && myBoards.findIndex(h=>h === hash) < 0) {
                //     this.requestChanges([
                //         {type: "set-agent-board",
                //         state: true,
                //         agent: myPubKey,
                //         hash: hash,
                //         }
                //     ])
                // }
                this.activeBoardHash.update((n) => {return hash} )
                this.activeBoardType.update((n)=> {return board.state().type})
            }
        }
        if (!board) {
            this.activeBoardHash.update((n) => {return undefined} )
            this.activeBoardType.update((n) => {return undefined} )
        }
    }

    async archiveBoard(hash: EntryHashB64) {
        this.requestChanges([{type:"set-status", hash ,status:"archived"}])
        // leave board and delete
        const board: Board = this.boards[hash]
        if (board) {
            board.workspace.leaveWorkspace()
            delete this.boards[hash]
        }
        if (get(this.activeBoardHash) == hash) {
            this.setActiveBoard(undefined)
        }
    }

    async unarchiveBoard(hash: EntryHashB64) {
        let changes : BoardListDelta[] = 
        [
            {type:"set-status", hash ,status:""}
        ]

        this.requestChanges(changes)
    }

    closeActiveBoard() {
        this.setActiveBoard(undefined)
    }

    async makeBoard(options: BoardState, fromHash?: EntryHashB64) : Promise<Board> {
        const board = await Board.Create(this.boardsRootStore)
        const workspaceStore = board.workspace
        const boardHash = board.hashB64()
        this.boards[boardHash] = board 
        if (options.type === undefined) {
            options.type = BoardType.Stickies
        }
        if (!options.name) {
            options.name = "untitled"
        }
        if (options !== undefined) {
            // let changes = []
            // if (options.type) {
            //     changes.push({
            //         type: "set-type",
            //         boardType: options.type
            //     })
            // }
            // if (options.name) {
            //     changes.push({
            //         type: "set-name",
            //         name: options.name
            //     })
            // }
            // if (options.props) {
            //     changes.push({
            //         type: "set-props",
            //         props: options.props
            //     })
            // }
            // if (options.stickies) {
            //     options.stickies.forEach((sticky)=>{
            //         changes.push({
            //             type: "add-sticky",
            //             value: sticky,
            //             group: UngroupedId
            //         })
                        
            //     })
            // }
            // if (options.groups) {
            //     changes.push({
            //         type: "set-groups",
            //         groups: options.groups
            //     })
            // }
            // if (options.voteTypes) {
            //     changes.push({
            //         type: "set-vote-types",
            //         voteTypes: options.voteTypes
            //     })
            // }
            let changes = [{
                type: "set-state",
                state: options
                },
            ]
            if (changes.length > 0) {
                workspaceStore.requestChanges(changes)
                await workspaceStore.commitChanges()
            }

            this.requestChanges([{
                type: 'add-board',
                name: board.state().name,
                hash: boardHash,
                status: ""
                },
                // {type: "set-agent-board",
                //  state: true,
                //  agent: encodeHashToBase64(this.rootStore.synStore.client.client.myPubKey),
                //  hash: boardHash,
                // }
            ])
        
        }
        return board
    }
}
