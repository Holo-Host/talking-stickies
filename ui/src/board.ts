import type { WorkspaceStore } from "@holochain-syn/store";
import type { TalkingStickiesDelta, TalkingStickiesGrammar } from "./grammar";
import { Readable, derived } from "svelte/store";

export const DEFAULT_VOTE_TYPES = [
    {type: "🗨", toolTip: "I want to talk about this one.", maxVotes: 3},
    {type: "⭐", toolTip: "Interesting!", maxVotes: 1},
    {type: "❓", toolTip: "I have questions about this topic.", maxVotes: 1},
]

export class VoteType {
    constructor(public type: string, public toolTip: string, public maxVotes: number){}
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