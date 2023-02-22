import { createEventDispatcher } from "svelte";
import { BoardType, type BoardState, type Sticky } from "./board";
import { v1 as uuidv1 } from "uuid";
import { cloneDeep, isEqual } from "lodash";
import type { AgentPubKeyB64 } from "@holochain/client";
import sanitize from "sanitize-filename";

const download = (filename: string, text: string) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export class Pane {    
    public dispatch
  
    constructor() {
        this.dispatch = createEventDispatcher()
    }
    
    exportBoard = (boardType: BoardType, state: BoardState) => {
        const prefix = boardType == BoardType.Stickies ? "ts" : "kando"
        const fileName = sanitize(`${prefix}_export_${state.name}.json`)
        download(fileName, JSON.stringify(state))
        alert(`Your board was exported to your Downloads folder as: '${fileName}'`)
    }

    addSticky = (text: string, group: uuidv1 , props: any) => {
        if (group === undefined) {group = 0}
        const sticky:Sticky = {
          id: uuidv1(),
          text,
          props,
          votes: {
          },
        };
        this.dispatch("requestChange", [{ type: "add-sticky", value: sticky, group}]);
    };

    updateSticky = (stickies, id: uuidv1, closeFn) => (text:string, groupId: uuidv1, props:any) => {
        const sticky = stickies.find((sticky) => sticky.id === id);
        if (!sticky) {
          console.error("Failed to find item with id", id);
        } else {
          let changes = []
          if (sticky.text != text) {
            changes.push({ type: "update-sticky-text", id: sticky.id, text: text })
          }
          console.log("sticky.props", sticky.props, "props", props)
          if (!isEqual(sticky.props, props)) {
            changes.push({ type: "update-sticky-props", id: sticky.id, props: cloneDeep(props)})
          }
          if (changes.length > 0) {
          this.dispatch("requestChange", changes);
          }
        }
        closeFn()
    };
    
    deleteSticky = (id: uuidv1, closeFn) => () => {
        this.dispatch("requestChange", [{ type: "delete-sticky", id }]);
        closeFn()
    };
 
    voteOnSticky = (agent:AgentPubKeyB64, stickies, id: uuidv1, type, max) => {
        const sticky = stickies.find((sticky) => sticky.id === id);
        if (!sticky) {
          console.error("Failed to find sticky with id", id);
          return;
        }
        let votes = {
          ...sticky.votes,
        }
        if (typeof votes[type] === 'undefined') {
          votes[type] = {}
          votes[type][agent] = 1
        } else {
          let voteBump = ((sticky.votes[type][agent] || 0) + 1)
          if (voteBump > max) {
            voteBump = 0
          }
          votes = {
            ...sticky.votes,
            [type]: {
              ...sticky.votes[type],
              [agent]: voteBump,
            },
          }
        }
        console.log("VOTING", agent);
        console.log("votes before", sticky.votes);
        console.log("votes after", votes);
    
        this.dispatch("requestChange", [
          {
            type: "update-sticky-votes",
            id: sticky.id,
            voteType: type,
            voter: agent,
            count: votes[type][agent],
          },
        ]);
    };

}