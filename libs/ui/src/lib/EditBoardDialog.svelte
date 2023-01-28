<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import { cloneDeep } from "lodash";
    import { Board, BoardType, Group, VoteType, type BoardState } from './board';
    import BoardEditor from './BoardEditor.svelte';
    import type { TalkingStickiesStore } from './talkingStickiesStore';
    import { getContext, onMount } from 'svelte';
    import { isEqual } from 'lodash'
    import type { EntryHashB64 } from '@holochain/client';

    export let boardType:BoardType = BoardType.Stickies
    export let boardHash:EntryHashB64|undefined = undefined
    let editName = ''
    let editGroups = []
    let editVoteTypes = []

    onMount(async () => {
        const board: Board | undefined = await store.boardList.getBoard(boardHash)
        if (board) {
            const state = board.state()
            editName = state.name
            editGroups = cloneDeep(state.groups)
            editVoteTypes = cloneDeep(state.voteTypes)
        } else {
            console.log("board not found:", boardHash)
        }
    })

    export let active = true
    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();

    const updateBoard = (hash: EntryHashB64) => async (_type:BoardType, name: string, groups: Group[], voteTypes: VoteType[]) => {
        // ignore board type we don't update that.
        const board: Board | undefined = await store.boardList.getBoard(hash)
        if (board) {
        let changes = []
        const state: BoardState = board.state()
        if (state.name != name) {
            console.log("updating board name to ",name)
            store.boardList.requestChanges([
            {
                type: 'set-name',
                hash: board.hashB64(),
                name: name
            }
            ])
            changes.push(
            {
                type: 'set-name',
                name: name
            })
        }
        if (!isEqual(groups, state.groups)) {
            console.log("with groups:", groups)
            changes.push({type: 'set-groups',
            groups: groups
            })
        }
        if (!isEqual(voteTypes, state.voteTypes)) {
            console.log("with voteTypes:", voteTypes)
            changes.push({type: 'set-vote-types',
            voteTypes: voteTypes
            })
        }
        if (changes.length > 0) {
            await store.boardList.requestBoardChanges(hash,changes)
        }
        }
        close()
    }
    const archiveBoard = (hash: EntryHashB64) => () => {
        store.boardList.archiveBoard(hash)
        close()
    }
    const close = ()=>{
        active=false
        boardHash=undefined
    }

</script>
<Dialog persistent bind:active>
    <BoardEditor handleSave={updateBoard(boardHash)} handleDelete={archiveBoard(boardHash)} cancelEdit={close} boardType={boardType} text={editName} groups={editGroups} voteTypes={editVoteTypes} />
</Dialog>
