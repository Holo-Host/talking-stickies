import type { RootStore, SynGrammar, WorkspaceStore } from "@holochain-syn/core";
import { get } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import { type AgentPubKey, type EntryHash, type AgentPubKeyB64, type EntryHashB64, encodeHashToBase64 } from "@holochain/client";
import type { Dictionary } from "@holochain-open-dev/core-types";

export const DEFAULT_STICKIE_VOTE_TYPES = [
    {type: "1", emoji: "🗨", toolTip: "I want to talk about this one.", maxVotes: 3},
    {type: "2", emoji: "⭐", toolTip: "Interesting!", maxVotes: 1},
    {type: "3", emoji: "❓", toolTip: "I have questions about this topic.", maxVotes: 1},
]

export const DEFAULT_KANBAN_VOTE_TYPES = [
  {type: "1", emoji: "⭐", toolTip: "Important", maxVotes: 1},
  {type: "2", emoji: "🚩", toolTip: "Flagged", maxVotes: 1},
  {type: "3", emoji: "❓", toolTip: "Unclear", maxVotes: 1},
  {type: "4", emoji: "❗", toolTip: "Risky", maxVotes: 1}
]

export const enum BoardType {
  KanBan = 'KanBan',
  Stickies = 'Stickies'
}

export class VoteType {
    type: uuidv1
    constructor(public emoji: string, public toolTip: string, public maxVotes: number){
        this.type = uuidv1()
    }
}

export type Sticky = {
    id: uuidv1;
    text: string;
    votes: Object;
    props: Object;
  };
  
  export const UngroupedId = "_"
  export class Group {
      id: uuidv1
      constructor(public name: string) {
          this.id =  uuidv1()
      }
  }
  export interface BoardState {
    type: BoardType;
    status: string;
    name: string;
    groups: Group[];
    grouping: Dictionary<Array<uuidv1>>;
    stickies: Sticky[];
    voteTypes: VoteType[];
  }
  
  export type BoardDelta =
    | {
        type: "set-type";
        boardType: BoardType;
      }
    | {
        type: "set-status";
        status: string;
      }
    | {
        type: "add-sticky";
        group: uuidv1;
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
        type: "set-group-order";
        id: uuidv1;
        order: Array<uuidv1>;
      }
    | {
        type: "update-sticky-group";
        id: uuidv1;
        group: uuidv1;
      }
      | {
        type: "update-sticky-props";
        id: uuidv1;
        props: Object;
      }
   | {
        type: "update-sticky-text";
        id: uuidv1;
        text: string;
      }
    | {
        type: "update-sticky-votes";
        id: uuidv1;
        voteType: string;
        voter: AgentPubKeyB64;
        count: number
      }
    | {
        type: "merge-stickies";
        srcId: uuidv1;
        dstId: uuidv1;
    }
    | {
        type: "delete-sticky";
        id: string;
      };
  
  export type BoardGrammar = SynGrammar<
  BoardDelta,
  BoardState
  >;
  
  const _removeStickyFromGroups = (state: BoardState, stickyId: uuidv1) => {
    // remove the item from the group it's in
    Object.entries(state.grouping).forEach(([groupId, itemIds]) =>{
      const index = itemIds.findIndex((id) => id === stickyId)
      if (index >= 0) {
        state.grouping[groupId].splice(index,1)
      }
    })
  }
  const _addStickyToGroup = (state: BoardState, groupId: uuidv1, stickyId: uuidv1) => {
    // add it to the new group
    if (state.grouping[groupId] !== undefined) {
      state.grouping[groupId].push(stickyId)
    }
    else {
      state.grouping[groupId] = [stickyId]
    }
  }
  export const boardGrammar: BoardGrammar = {
    initState(state)  {
      state.status = ""
      state.name = "untitled"
      state.groups = [{id:UngroupedId, name:""}]
      state.stickies = []
      state.voteTypes = []
      state.grouping = {}
      state.grouping[UngroupedId] = []
    },
    applyDelta( 
      delta: BoardDelta,
      state: BoardState,
      _ephemeralState: any,
      _author: AgentPubKey
    ) {

      if (delta.type == "set-type") {
        state.type = delta.boardType
      }      
      if (delta.type == "set-status") {
        state.status = delta.status
      }
      if (delta.type == "set-name") {
        state.name = delta.name
      }
      if (delta.type == "set-groups") {
        state.groups = delta.groups
        const idx = delta.groups.findIndex((group) => group.id === UngroupedId)
        if (idx == -1) {
          state.groups.unshift({id:UngroupedId, name:""})
        }
        const idList = {}
        delta.groups.forEach(group => {
          idList[group.id] = true
          // add an entry to the groupings for any new groups
          if (state.grouping[group.id] === undefined) {
            state.grouping[group.id] = []
          }
        })

        // remove any non-existent grouping lists
        Object.entries(state.grouping).forEach(([groupId, itemIds]) => {
          if (groupId != UngroupedId) {
            if (!idList[groupId]) {
              delete state.grouping[groupId]
              // move items from deleted groups to the ungrouped group
              state.grouping[UngroupedId] = state.grouping[UngroupedId].concat(itemIds)
            }
          }
        })

      }
      if (delta.type == "set-group-order") {
        state.grouping[delta.id] = delta.order
      }
      if (delta.type == "set-vote-types") {
        state.voteTypes = delta.voteTypes
      }
      else if (delta.type == "add-sticky") {
        state.stickies.push(delta.value)
        if (state.grouping[delta.group] !== undefined) {
          state.grouping[delta.group].push(delta.value.id)
        }
        else {
          state.grouping[delta.group] = [delta.value.id]
        }
      }
      else if (delta.type == "update-sticky-text") {
        state.stickies.forEach((sticky, i) => {
          if (sticky.id === delta.id) {
            state.stickies[i].text = delta.text;
          }
        });
      }
      else if (delta.type == "update-sticky-group") {
        _removeStickyFromGroups(state, delta.id)
        _addStickyToGroup(state, delta.group, delta.id)
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
      else if (delta.type == "merge-stickies") {
        const srcIdx = state.stickies.findIndex((sticky) => sticky.id === delta.srcId)
        const dstIdx = state.stickies.findIndex((sticky) => sticky.id === delta.dstId)
        if (srcIdx >= 0 && dstIdx >= 0) {
          _removeStickyFromGroups(state, delta.srcId)
          const src = state.stickies[srcIdx]
          const dst = state.stickies[dstIdx]
          dst.text = `${dst.text}\n\n-----------\n\n${src.text}`
          state.stickies.splice(srcIdx,1)
        }
      }
      else if (delta.type == "delete-sticky") {
        const index = state.stickies.findIndex((sticky) => sticky.id === delta.id)
        state.stickies.splice(index,1)
        _removeStickyFromGroups(state, delta.id)
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
        return encodeHashToBase64(this.workspace.workspaceHash)
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
