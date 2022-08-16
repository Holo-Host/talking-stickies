import type { WorkspaceStore } from "@holochain-syn/store";
import type { TalkingStickiesDelta, TalkingStickiesGrammar } from "./grammar";
import { Readable, derived } from "svelte/store";

export class Board {
    name: Readable<string>
    workspace: WorkspaceStore<TalkingStickiesGrammar>
    constructor(workspace: WorkspaceStore<TalkingStickiesGrammar>) {
        console.log("FISH", workspace.state)
        this.name = derived(workspace.state, state => state.name)
        this.workspace = workspace
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    requestChanges(deltas: Array<TalkingStickiesDelta>) {
        console.log("REQUESTING CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
}
