import type { EntryHashB64 } from "@holochain-open-dev/core-types";
import type { SessionStore } from "@holochain-syn/store";
import type { TalkingStickiesGrammar } from "./grammar";

export type Board = {
    name: string
    commit: EntryHashB64
    session: SessionStore<TalkingStickiesGrammar>
};