import type { WorkspaceStore } from "@holochain-syn/store";
import type { TalkingStickiesDelta, TalkingStickiesGrammar } from "./grammar";
import { Readable, derived } from "svelte/store";

export class VoteType {
    constructor(public type: string, public toolTip: string){}
}

export class Board {
    name: Readable<string>
    voteTypes: Array<VoteType>
    constructor(public workspace: WorkspaceStore<TalkingStickiesGrammar>) {
        this.name = derived(workspace.state, state => state.name)
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    requestChanges(deltas: Array<TalkingStickiesDelta>) {
        console.log("REQUESTING CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
}

export class Group {
    id: number
    constructor(public name: string) {
        this.id = Date.now()
    }
}