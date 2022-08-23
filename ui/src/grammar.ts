import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import type { SynGrammar } from "@holochain-syn/store";
import type { AgentPubKey } from "@holochain/client";
import type { Group } from "./board";

type Sticky = {
  id: string;
  text: string;
  group: number;
  votes: Object;
};

export interface TalkingStickiesState {
  name: string;
  groups: Group[];
  stickies: Sticky[];
}

export type TalkingStickiesDelta =
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

export type TalkingStickiesGrammar = SynGrammar<
TalkingStickiesDelta,
TalkingStickiesState
>;

export const talkingStickiesGrammar: TalkingStickiesGrammar = {
  initState(state)  {
    state.name = "untitled"
    state.groups = [{id:0, name:"group1"}]
    state.stickies = []
  },
  applyDelta( 
    delta: TalkingStickiesDelta,
    state: TalkingStickiesState,
    _ephemeralState: any,
    _author: AgentPubKey
  ) {
    if (delta.type == "set-name") {
      state.name = delta.name
    }
    if (delta.type == "set-groups") {
      state.groups = delta.groups
        console.log("setting", delta.groups)
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
