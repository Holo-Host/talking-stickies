import type { WorkspaceStore } from "@holochain-syn/store";
import type { TalkingStickiesDelta, TalkingStickiesGrammar } from "./grammar";
import { Readable, derived } from "svelte/store";

export class Board {
    name: Readable<string>
    constructor(public workspace: WorkspaceStore<TalkingStickiesGrammar>) {
        this.name = derived(workspace.state, state => state.name)
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    requestChanges(deltas: Array<TalkingStickiesDelta>) {
        this.workspace.requestChanges(deltas)
    }
}
