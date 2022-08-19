import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";
import type { SynGrammar } from "@holochain-syn/store";
import type { AgentPubKey } from "@holochain/client";

type Sticky = {
  id: string;
  text: string;
  votes: Object;
};

export interface TalkingStickiesState {
  name: string,
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
    state.name = "untitles"
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
