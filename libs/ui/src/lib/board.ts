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
  {type: "1", emoji: "🐞", toolTip: "Bug", maxVotes: 1},
  {type: "2", emoji: "➕", toolTip: "Feature", maxVotes: 1},
  {type: "3", emoji: "🚩", toolTip: "Flagged", maxVotes: 1},
  {type: "5", emoji: "❗", toolTip: "Risky", maxVotes: 1}
]

export const enum BoardType {
  KanDo = 'KanDo',
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
export type BoardProps = {
  bgUrl: string
}

export interface BoardState {
  type: BoardType;
  status: string;
  name: string;
  groups: Group[];
  grouping: Dictionary<Array<uuidv1>>;
  stickies: Sticky[];
  voteTypes: VoteType[];
  props: BoardProps;
}
  
  export type BoardDelta =
    | {
        type: "set-type";
        boardType: BoardType;
      }
    | {
        type: "set-state";
        state: BoardState;
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
        type: "set-props";
        props: BoardProps;
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
        index: undefined | number
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
    _initGrouping(state)
    // remove the item from the group it's in
    Object.entries(state.grouping).forEach(([groupId, itemIds]) =>{
      const index = itemIds.findIndex((id) => id === stickyId)
      if (index >= 0) {
        state.grouping[groupId].splice(index,1)
      }
    })
  }
  const _addStickyToGroup = (state: BoardState, groupId: uuidv1, stickyId: uuidv1, index: undefined|number) => {
    _initGrouping(state)
    // add it to the new group
    if (state.grouping[groupId] !== undefined) {
      if (index === undefined || index >= state.grouping[groupId].length) {
        state.grouping[groupId].push(stickyId)
      } else {
        state.grouping[groupId].splice(index, 0, stickyId)
      }
    }
    else {
      state.grouping[groupId] = [stickyId]
    }
  }
  const _initGrouping = (state) => {
    if (state.grouping === undefined) {
      state.grouping = {}
      const ungrouped = []
      state.stickies.forEach((sticky)=>ungrouped.push(sticky.id))
      state.grouping[UngroupedId] = ungrouped
    }
  }
  const _setGroups = (newGroups, state) => {
    state.groups = newGroups
    if (state.groups === undefined) state.groups = []
    const idx = newGroups.findIndex((group) => group.id === UngroupedId)
    if (idx == -1) {
      state.groups.unshift({id:UngroupedId, name:""})
    }
    const idList = {}
    newGroups.forEach(group => {
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

  export const boardGrammar: BoardGrammar = {
    initState(state)  {
      state.status = ""
      state.name = "untitled"
      state.groups = [{id:UngroupedId, name:""}]
      state.stickies = []
      state.voteTypes = []
      state.props = {bgUrl:""}
      _initGrouping(state)
    },
    applyDelta( 
      delta: BoardDelta,
      state: BoardState,
      _ephemeralState: any,
      _author: AgentPubKey
    ) {
      switch (delta.type) {
        case "set-type":
          state.type = delta.boardType
          break;
        case "set-status":
          state.status = delta.status
          break;
        case "set-state":
          if (delta.state.type !== undefined) state.type = delta.state.type
          if (delta.state.status !== undefined) state.status = delta.state.status
          if (delta.state.name !== undefined) state.name = delta.state.name
          if (delta.state.groups !== undefined) state.groups = delta.state.groups
          _setGroups(delta.state.groups, state)
          if (delta.state.stickies !== undefined) state.stickies = delta.state.stickies
          if (delta.state.voteTypes !== undefined) state.voteTypes = delta.state.voteTypes
          if (delta.state.props !== undefined) state.props = delta.state.props
          if (delta.state.grouping !== undefined) {
            state.grouping = delta.state.grouping
          } else if (state.grouping === undefined) {
            _initGrouping(state)
          }
          break;
        case "set-name":
          state.name = delta.name
          break;
        case "set-props":
          state.props = delta.props
          break;
        case "set-groups":
          _initGrouping(state)
          _setGroups(delta.groups, state)
          break;
        case "set-group-order":
          _initGrouping(state)
          state.grouping[delta.id] = delta.order
          break;
        case "set-vote-types":
          state.voteTypes = delta.voteTypes
          break;
        case "add-sticky":
          _initGrouping(state)    
          state.stickies.push(delta.value)
          if (state.grouping[delta.group] !== undefined) {
            state.grouping[delta.group].push(delta.value.id)
          }
          else {
            state.grouping[delta.group] = [delta.value.id]
          }
          break;
        case "update-sticky-text":
          state.stickies.forEach((sticky, i) => {
            if (sticky.id === delta.id) {
              state.stickies[i].text = delta.text;
            }
          });
          break;
        case "update-sticky-group":
          _removeStickyFromGroups(state, delta.id)
          _addStickyToGroup(state, delta.group, delta.id, delta.index)
          break;
        case "update-sticky-props":
          state.stickies.forEach((sticky, i) => {
            if (sticky.id === delta.id) {
              state.stickies[i].props = delta.props;
            }
          });
          break;
        case "update-sticky-votes":
          state.stickies.forEach((sticky, i) => {
            if (sticky.id === delta.id) {
              if (!state.stickies[i].votes[delta.voteType]) {
                state.stickies[i].votes[delta.voteType] = {}
              }
              state.stickies[i].votes[delta.voteType][delta.voter] = delta.count;
            }
          });
          break;
        case "merge-stickies":
          const srcIdx = state.stickies.findIndex((sticky) => sticky.id === delta.srcId)
          const dstIdx = state.stickies.findIndex((sticky) => sticky.id === delta.dstId)
          if (srcIdx >= 0 && dstIdx >= 0) {
            _removeStickyFromGroups(state, delta.srcId)
            const src = state.stickies[srcIdx]
            const dst = state.stickies[dstIdx]
            dst.text = `${dst.text}\n\n-----------\n\n${src.text}`
            state.stickies.splice(srcIdx,1)
          }
          break;
        case "delete-sticky":
          const index = state.stickies.findIndex((sticky) => sticky.id === delta.id)
          state.stickies.splice(index,1)
          _removeStickyFromGroups(state, delta.id)
          break;
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
