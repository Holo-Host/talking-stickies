import type { WorkspaceStore } from "@holochain-syn/store";
import type { TalkingStickiesDelta, TalkingStickiesGrammar } from "./grammar";
import { Readable, derived } from "svelte/store";
import { v1 as uuidv1 } from "uuid";

export const DEFAULT_VOTE_TYPES = [
    {type: "1", emoji: "🗨", toolTip: "I want to talk about this one.", maxVotes: 3},
    {type: "2", emoji: "⭐", toolTip: "Interesting!", maxVotes: 1},
    {type: "3", emoji: "❓", toolTip: "I have questions about this topic.", maxVotes: 1},
]

export class VoteType {
    type: uuidv1
    constructor(public emoji: string, public toolTip: string, public maxVotes: number){
        this.type = uuidv1()
    }
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