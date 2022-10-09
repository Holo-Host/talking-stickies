import type { CellClient } from '@holochain-open-dev/cell-client';
import type {
    EntryHash,
  } from '@holochain/client';
import type { AgentPubKeyB64, Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';
import { serializeHash, deserializeHash, RecordBag, EntryHashMap } from '@holochain-open-dev/utils';
import { WorkspaceStore, SynStore, stateFromCommit,  SynClient, type Workspace, type Commit, RootStore } from '@holochain-syn/core';
import { get } from "svelte/store";
import { CommitTypeBoard } from './board';
import { BoardList, CommitTypeBoardList } from './boardList';
import { decode } from '@msgpack/msgpack';

const ZOME_NAME = 'talking_stickies'

export class TalkingStickiesService {
    constructor(public cellClient: CellClient, public zomeName = ZOME_NAME) {}

    private callZome(fnName: string, payload: any) {
        return this.cellClient.callZome(this.zomeName, fnName, payload);
    }
}


export class TalkingStickiesStore {
    service: TalkingStickiesService;
    boardList: BoardList;
    createdBoards: Array<EntryHash> = []
    updating = false
    synStore: SynStore;
    cellClient: CellClient;
    myAgentPubKey(): AgentPubKeyB64 {
        return serializeHash(this.cellClient.cell.cell_id[1]);
    }

    constructor(
        protected cellClientIn: CellClient,
        zomeName: string = ZOME_NAME
    ) {
        this.cellClient = cellClientIn
        this.service = new TalkingStickiesService(
          this.cellClient,
          zomeName
        );
        //@ts-ignore
        this.synStore = new SynStore(new SynClient(this.cellClient))
        // this.synStore.knownRoots.subscribe( async (roots) => {
        //     if (this.updating) {
        //         console.log(`${roots.entryActions.keys().length} ROOTS UPDATE CALLED but allready updating`, roots)
        //         return
        //     }
        //     this.updating = true
        //     try {
        //         await this.findOrMakeRoots(roots)
        //     } catch (e) {
        //         console.log("Error while updating board list: ",e)
        //     }
        //     this.updating = false
        // })
    }

    commitType(commit: Commit) : string {
        const meta:any = decode(commit.meta)
        console.log("CHECKING meta for board:", meta)
        return meta.type
    }

    async findOrMakeRoots(roots: RecordBag<Commit>): Promise<any> {
        const entries = roots.entryMap.entries()
        console.log(`Found ${entries.length} root entries`)
        if (entries.length == 0) { 
            console.log(`Found no root entries, creating`)
            this.boardList = await BoardList.Create(this.synStore);
        } else {
            let boardListRoot
            let boardsRoot
                    
            entries.forEach(async ([hash, commit], i) => {
                const commitType = this.commitType(commit)
                const rootCommit = roots.entryRecords[i]
                if (commitType === CommitTypeBoardList) {
                    if (!boardListRoot) {
                        console.log("Found a board list root, joining...", rootCommit.entryHash)
                        boardListRoot = rootCommit
                    } else {
                        console.log("Found a board list root, but have allready joined:", boardListRoot.entryHash)
                    }
                }
                if (commitType === CommitTypeBoard) {
                    if (!boardsRoot) {
                        console.log("Storing a board root:", rootCommit.entryHash)
                        boardsRoot = rootCommit
                    } else {
                        console.log("Found a board root, but have allread stored: ", boardsRoot.entryHash)
                    }
                }
            });
            if (boardListRoot && boardsRoot) {
                this.boardList = await BoardList.Join(this.synStore, boardListRoot, boardsRoot)
            } else {
                console.log("Missing root, found: ",boardListRoot, boardsRoot )
            }

        }
    }

    async loadBoards() : Promise<any> {
        console.log("FINDING ROOTS")
        const roots = await this.synStore.fetchAllRoots()
        await this.findOrMakeRoots(get(roots))
    }
}