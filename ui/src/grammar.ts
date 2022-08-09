import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

import type { SynGrammar } from "@holochain-syn/store";

type Sticky = {
  id: string;
  text: string;
  votes: Object;
};

export interface TalkingStickiesState {
  name: string,
  stickies: Sticky[];
}

type TalkingStickiesDelta =
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
      votes: Object;
    }
  | {
      type: "delete-sticky";
      id: string;
    };

export type TalkingStickiesGrammar = SynGrammar<
  TalkingStickiesState,
  TalkingStickiesDelta
>;

export const talkingStickiesGrammar: TalkingStickiesGrammar = {
  initialState: {
    name: "untitled",
    stickies: [],
  },
  applyDelta(
    state: TalkingStickiesState,
    delta: TalkingStickiesDelta,
    _author: AgentPubKeyB64
  ): TalkingStickiesState {
    switch (delta.type) {
      case "set-name": {
        return { name: delta.name, stickies: state.stickies };
      }
      case "add-sticky": {
        return { name: state.name, stickies: [...state.stickies, delta.value] };
      }
      case "update-sticky-text": {
        const updatedStickies = state.stickies.map((sticky) => {
          if (sticky.id === delta.id) {
            sticky.text = delta.text;
          }
          return sticky
        });
        return { name: state.name, stickies: updatedStickies };
      }
      case "update-sticky-votes": {
        const updatedStickies = state.stickies.map((sticky) => {
          if (sticky.id === delta.id) {
            sticky.votes = delta.votes;
          }
          return sticky
        });
        return { name: state.name, stickies: updatedStickies };
      }
      case "delete-sticky": {
        const updatedStickies = state.stickies.filter((sticky) => sticky.id !== delta.id)
        return { name: state.name, stickies: updatedStickies };
      }
    }
  },
};
