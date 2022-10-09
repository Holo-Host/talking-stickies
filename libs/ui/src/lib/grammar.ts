import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import type { SynGrammar } from "@holochain-syn/core";
import type { AgentPubKey } from "@holochain/client";
import { Group, VoteType, DEFAULT_VOTE_TYPES } from "./board";

type Sticky = {
  id: string;
  text: string;
  group: number;
  votes: Object;
  props: Object;
};

export interface TalkingStickiesState {
  status: string;
  name: string;
  groups: Group[];
  stickies: Sticky[];
  voteTypes: VoteType[];
}

export type TalkingStickiesDelta =
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

export type TalkingStickiesGrammar = SynGrammar<
TalkingStickiesDelta,
TalkingStickiesState
>;

export const talkingStickiesGrammar: TalkingStickiesGrammar = {
  initState(state)  {
    state.status = ""
    state.name = "untitled"
    state.groups = [{id:0, name:"group1"}]
    state.stickies = []
    state.voteTypes = DEFAULT_VOTE_TYPES
  },
  applyDelta( 
    delta: TalkingStickiesDelta,
    state: TalkingStickiesState,
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
