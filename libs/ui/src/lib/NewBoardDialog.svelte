<script lang="ts">
    import { Dialog } from 'svelte-materialify';
    import { cloneDeep } from "lodash";
    import { BoardType, DEFAULT_KANBAN_VOTE_TYPES, DEFAULT_STICKIE_VOTE_TYPES, Group, VoteType, type BoardProps } from './board';
    import BoardEditor from './BoardEditor.svelte';
    import type { TalkingStickiesStore } from './talkingStickiesStore';
    import { getContext } from 'svelte';

    export let boardType
    let editVoteTypes = cloneDeep(boardType == BoardType.Stickies ? DEFAULT_STICKIE_VOTE_TYPES : DEFAULT_KANBAN_VOTE_TYPES)
    export let active = true
    const { getStore } :any = getContext('tsStore');

    const store:TalkingStickiesStore = getStore();

    const addBoard = async (type: BoardType, name: string, groups: Group[], voteTypes: VoteType[], props: BoardProps) => {
        // @ts-ignore
        const board = await store.boardList.makeBoard({type, name, groups, voteTypes, props, status:""})
        store.boardList.setActiveBoard(board.hashB64())
        active = false
    }

</script>
<Dialog persistent bind:active>
    <BoardEditor title="New Board" handleSave={addBoard} cancelEdit={()=>active=false} boardType={boardType} voteTypes={editVoteTypes} groups={[]} props={{bgUrl:""}} />
</Dialog>
