import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

import type { SynGrammar } from "@holochain-syn/store";

type Sticky = {
  id: string;
  text: string;
  votes: Object;
};

interface TalkingStickiesState {
  stickies: Sticky[];
}

type TalkingStickiesDelta =
  | {
      type: "add-sticky";
      value: Sticky;
    }
  | {
      type: "update-sticky";
      value: Sticky;
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
      case "update-sticky": {
        const updatedStickies = state.stickies.map((sticky) => {
          if (sticky.id === delta.value.id) {
            return delta.value;
          } else {
            return sticky;
          }
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
