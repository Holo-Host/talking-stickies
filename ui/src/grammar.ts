import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

import type { SynGrammar } from "@holochain-syn/store";

type Sticky = {
  id: string;
  text: string;
  votes: Object;
};

export interface TalkingStickiesState {
  stickies: Sticky[];
}

type TalkingStickiesDelta =
  | {
      type: "add-sticky";
      value: Sticky;
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
    stickies: [],
  },
  applyDelta(
    state: TalkingStickiesState,
    delta: TalkingStickiesDelta,
    _author: AgentPubKeyB64
  ): TalkingStickiesState {
    switch (delta.type) {
      case "add-sticky": {
        return { stickies: [...state.stickies, delta.value] };
      }
      case "update-sticky-text": {
        const updatedStickies = state.stickies.map((sticky) => {
          if (sticky.id === delta.id) {
            sticky.text = delta.text;
          }
          return sticky
        });
        return { stickies: updatedStickies };
      }
      case "update-sticky-votes": {
        const updatedStickies = state.stickies.map((sticky) => {
          if (sticky.id === delta.id) {
            sticky.votes = delta.votes;
          }
          return sticky
        });
        return { stickies: updatedStickies };
      }
      case "delete-sticky": {
        const updatedStickies = state.stickies.filter((sticky) => sticky.id !== delta.id)
        return { stickies: updatedStickies };
      }
    }
  },
};
