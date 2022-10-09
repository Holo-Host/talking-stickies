import type { RootStore, SynGrammar, WorkspaceStore } from "@holochain-syn/core";
import { get } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import type { AgentPubKey, EntryHash } from "@holochain/client";
import type { AgentPubKeyB64, EntryHashB64 } from "@holochain-open-dev/core-types";
import { serializeHash } from "@holochain-open-dev/utils";

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

export type Sticky = {
    id: string;
    text: string;
    group: number;
    votes: Object;
    props: Object;
  };
  
  export interface BoardState {
    status: string;
    name: string;
    groups: Group[];
    stickies: Sticky[];
    voteTypes: VoteType[];
  }
  
  export type BoardDelta =
    | {
      type: "set-status";
      status: string;
    }
    | {
        type: "add-sticky";
        value: Sticky;
      }
    | {
        type: "set-name";
        name: string;
      }
    | {
        type: "set-groups";
        groups: Group[];
      }
    | {
        type: "set-vote-types";
        voteTypes: VoteType[];
      }
    | {
        type: "add-group";
        group: Group;
      }
    | {
        type: "delete-group";
        id: number;
      }
    | {
        type: "set-group-index";
        id: number;
        index: number;
      }
    | {
        type: "update-sticky-group";
        id: string;
        group: number;
      }
      | {
        type: "update-sticky-props";
        id: string;
        props: Object;
      }
   | {
        type: "update-sticky-text";
        id: string;
        text: string;
      }
    | {
        type: "update-sticky-votes";
        id: string;
        voteType: string;
        voter: AgentPubKeyB64;
        count: number
      }
    | {
        type: "delete-sticky";
        id: string;
      };
  
  export type BoardGrammar = SynGrammar<
  BoardDelta,
  BoardState
  >;
  
  export const boardGrammar: BoardGrammar = {
    initState(state)  {
      state.status = ""
      state.name = "untitled"
      state.groups = [{id:0, name:"group1"}]
      state.stickies = []
      state.voteTypes = DEFAULT_VOTE_TYPES
    },
    applyDelta( 
      delta: BoardDelta,
      state: BoardState,
      _ephemeralState: any,
      _author: AgentPubKey
    ) {
      if (delta.type == "set-status") {
        state.status = delta.status
      }
      if (delta.type == "set-name") {
        state.name = delta.name
      }
      if (delta.type == "set-groups") {
        state.groups = delta.groups
      }
      if (delta.type == "add-group") {
        console.log("PUSHING", delta.group)
  
        state.groups.push(delta.group)
      }
      if (delta.type == "delete-group") {
        const index = state.groups.findIndex((group) => group.id === delta.id)
        if (index >= 0) {
          state.groups.splice(index,1)
        }
      }
      if (delta.type == "set-group-index") {
        const index = state.groups.findIndex((group) => group.id === delta.id)
        if (index >= 0) {
          const c = state.groups[index]
          state.groups.splice(index,1)
          state.groups.splice(index, 0, c)
        }
      }
      if (delta.type == "set-vote-types") {
        state.voteTypes = delta.voteTypes
      }
      else if (delta.type == "add-sticky") {
        state.stickies.push(delta.value)
      }
      else if (delta.type == "update-sticky-text") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            state.stickies[i].text = delta.text;
          }
        });
      }
      else if (delta.type == "update-sticky-group") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            state.stickies[i].group = delta.group;
          }
        });
      }
      else if (delta.type == "update-sticky-props") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            state.stickies[i].props = delta.props;
          }
        });
      }
      else if (delta.type == "update-sticky-votes") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            if (!state.stickies[i].votes[delta.voteType]) {
              state.stickies[i].votes[delta.voteType] = {}
            }
            state.stickies[i].votes[delta.voteType][delta.voter] = delta.count;
          }
        });
      }
      else if (delta.type == "delete-sticky") {
        const index = state.stickies.findIndex((sticky) => sticky.id === delta.id)
        state.stickies.splice(index,1)
      }
    },
  };
  

export const CommitTypeBoard :string = "board"

export class Board {    
    constructor(public workspace: WorkspaceStore<BoardGrammar>) {
    }

    public static async Create(rootStore: RootStore<BoardGrammar>) {
        const workspaceHash = await rootStore.createWorkspace(
            `${new Date}`,
            rootStore.root.entryHash
           );
        const me = new Board(await rootStore.joinWorkspace(workspaceHash));
        return me
    }

    hash() : EntryHash {
        return this.workspace.workspaceHash
    }
    hashB64() : EntryHashB64 {
        return serializeHash(this.workspace.workspaceHash)
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    state(): BoardState {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<BoardDelta>) {
        console.log("REQUESTING BOARD CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }
}

export class Group {
    id: number
    constructor(public name: string) {
        this.id = Date.now()
    }
}