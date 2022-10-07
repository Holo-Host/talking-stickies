import type { SynGrammar, WorkspaceStore } from "@holochain-syn/store";
import type { TalkingStickiesDelta, TalkingStickiesGrammar, TalkingStickiesState } from "./grammar";
import { type Readable, derived, get } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import type { AgentPubKey, EntryHash } from "@holochain/client";
import { isEqual } from 'lodash'
import type { EntryHashB64 } from "@holochain-open-dev/core-types";

export const DEFAULT_VOTE_TYPES = [
    {type: "1", emoji: "🗨", toolTip: "I want to talk about this one.", maxVotes: 3},
    {type: "2", emoji: "⭐", toolTip: "Interesting!", maxVotes: 1},
    {type: "3", emoji: "❓", toolTip: "I have questions about this topic.", maxVotes: 1},
]

export class VoteType {
    type: uuidv1
    constructor(public emoji: string, public toolTip: string, public maxVotes: number){
        this.type = uuidv1()
    }
}

export interface BoardRecord {
    hash: EntryHashB64
    name: string
    status: string
}

export interface BoardListState {
    boards: BoardRecord[];
}

export type BoardListDelta =
  | {
    type: "add-board";
    hash: EntryHashB64;
    name: string;
    status?: string;
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
  };

export type BoardListGrammar = SynGrammar<
BoardListDelta,
BoardListState
>;

export const boardListGrammar: BoardListGrammar = {
    initState(state)  {
        state.boards = []
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
        }
    }

export class Board {
    name: Readable<string>
    constructor(public workspace: WorkspaceStore<TalkingStickiesGrammar>) {
        this.name = derived(workspace.state, state => state.name)
    }
    hash() : EntryHash {
        return this.workspace.workspaceHash
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    state() {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<TalkingStickiesDelta>) {
        console.log("REQUESTING CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }
}

export class ArchivedBoard {
    constructor(
        public state: TalkingStickiesState,
    ) {}
}

export class Group {
    id: number
    constructor(public name: string) {
        this.id = Date.now()
    }
}