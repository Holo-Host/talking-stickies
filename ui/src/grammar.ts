import type { AgentPubKeyB64 } from "@holochain-open-dev/core-types";

import type { SynGrammar } from "@holochain-syn/store";
import { textEditorGrammar, TextEditorState, TextEditorDelta } from '@holochain-syn/text-editor';

type Sticky = {
  id: string;
  text: TextEditorState;
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
      stickyId: string
      textEditorDelta: TextEditorDelta
    }
  | {
      type: "update-sticky-votes";
      value: Sticky;
    }
    | {
      type: "delete-sticky";
      value: Sticky;
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
    author: AgentPubKeyB64
  ): TalkingStickiesState {
    switch (delta.type) {
      case "add-sticky": {
        return { stickies: [...state.stickies, delta.value] };
      }
      case "update-sticky-text": {
        const updatedStickies = state.stickies.map((sticky) => {
          if (sticky.id === delta.stickyId) {
            sticky.text = textEditorGrammar.applyDelta(
                sticky.text,
                delta.textEditorDelta,
                author
              )
            return sticky
          } else {
            return sticky;
          }
        });
        return { stickies: updatedStickies };
      }
      case "update-sticky-votes": {
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
        const updatedStickies = state.stickies.filter((sticky) => sticky => sticky.id !== delta.value.id)
        return { stickies: updatedStickies };
      }
    }
  },
};
