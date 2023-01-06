import type {
    AppAgentClient,
    EntryHash,
    AgentPubKeyB64,
    AppAgentCallZomeRequest,
    RoleName,
  } from '@holochain/client';
import { serializeHash, RecordBag } from '@holochain-open-dev/utils';
import { WorkspaceStore, SynStore, stateFromCommit,  SynClient, type Workspace, type Commit, RootStore } from '@holochain-syn/core';
import { get } from "svelte/store";
import { CommitTypeBoard } from './board';
import { BoardList, CommitTypeBoardList } from './boardList';
import { decode } from '@msgpack/msgpack';

const ZOME_NAME = 'syn'

export class TalkingStickiesService {
    constructor(public client: AppAgentClient, public roleName, public zomeName = ZOME_NAME) {}

    private callZome(fnName: string, payload: any) {
        const req: AppAgentCallZomeRequest = {
            role_name: this.roleName,
            zome_name: this.zomeName,
            fn_name: fnName,
            payload
          }
        return this.client.callZome(req);
    }
}


export class TalkingStickiesStore {
    service: TalkingStickiesService;
    boardList: BoardList;
    createdBoards: Array<EntryHash> = []
    updating = false
    synStore: SynStore;
    client: AppAgentClient;
    myAgentPubKey(): AgentPubKeyB64 {
        return serializeHash(this.client.myPubKey);
    }

    constructor(
        protected clientIn: AppAgentClient,
        protected roleName: RoleName,
        protected zomeName: string = ZOME_NAME
    ) {
        this.client = clientIn
        this.service = new TalkingStickiesService(
          this.client,
          this.roleName,
          this.zomeName
        );
        //@ts-ignore
        this.synStore = new SynStore(new SynClient(this.client,this.roleName,this.zomeName))
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
                        console.log("Found a board list root:", serializeHash(rootCommit.entryHash))
                        boardListRoot = rootCommit
                    } else {
                        console.log("Found a board list root, but have allready joined:", serializeHash(boardListRoot.entryHash))
                    }
                }
                if (commitType === CommitTypeBoard) {
                    if (!boardsRoot) {
                        console.log("Found a board root:", serializeHash(rootCommit.entryHash))
                        boardsRoot = rootCommit
                    } else {
                        console.log("Found a board root, but have allread stored: ", serializeHash(boardsRoot.entryHash))
                    }
                }
            });
            if (boardListRoot && boardsRoot) {
                this.boardList = await BoardList.Join(this.synStore, boardListRoot, boardsRoot)
            } else {
                console.log("Missing root, found: ", boardListRoot, boardsRoot )
            }

        }
    }

    async loadBoards() : Promise<any> {
        console.log("fetching all roots...")
        try {
            const roots = await this.synStore.fetchAllRoots()
            await this.findOrMakeRoots(get(roots))
        } catch (e) {
            console.log("Error Fetching Roots:", e)
        }
    }
}