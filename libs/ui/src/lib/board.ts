import type { WorkspaceStore } from "@holochain-syn/store";
import type { TalkingStickiesDelta, TalkingStickiesGrammar, TalkingStickiesState } from "./grammar";
import { type Readable, derived, get } from "svelte/store";
import { v1 as uuidv1 } from "uuid";
import type { EntryHash } from "@holochain/client";

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
    constructor(public workspace: WorkspaceStore<TalkingStickiesGrammar>) {
        this.name = derived(workspace.state, state => state.name)
    }
    hash() : EntryHash {
        return this.workspace.workspaceHash
    }
    close() {
        this.workspace.leaveWorkspace()
    }
    state() {
        return get(this.workspace.state)
    }
    requestChanges(deltas: Array<TalkingStickiesDelta>) {
        console.log("REQUESTING CHANGES: ", deltas)
        this.workspace.requestChanges(deltas)
    }
    participants()  {
        return this.workspace.participants
    }
    async commitChanges() {
        this.workspace.commitChanges()
    }
}

export class ArchivedBoard {
    constructor(
        public state: TalkingStickiesState,
    ) {}
}

export class Group {
    id: number
    constructor(public name: string) {
        this.id = Date.now()
    }
}