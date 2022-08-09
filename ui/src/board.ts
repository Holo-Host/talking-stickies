import type { SessionStore } from "@holochain-syn/store";
import type { TalkingStickiesGrammar } from "./grammar";
import { Readable, derived } from "svelte/store";

export class Board {
    name: Readable<string>
    constructor(public session: SessionStore<TalkingStickiesGrammar>) {
        this.name = derived(session.state, state => state.name)
    }
    close() {
        this.session.leave()
    }
    requestChanges(deltas) {
        this.session.requestChanges(deltas)
    }
}
