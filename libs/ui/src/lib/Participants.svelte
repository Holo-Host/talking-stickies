<script>
    import ExIcon from './icons/ExIcon.svelte'
    import {HoloIdenticon} from "@holochain-open-dev/elements";
  import { encodeHashToBase64 } from '@holochain/client';

    if (!customElements.get('holo-identicon')){
      customElements.define('holo-identicon', HoloIdenticon)
    }

    export let close
//    export let participants
    export let active
    export let avatars

    let modal

    const handle_keydown = e => {
		if (e.key === 'Escape') {
			close();
			return;
		}

		if (e.key === 'Tab') {
			// trap focus
			const nodes = modal.querySelectorAll('*');
			const tabbable = Array.from(nodes).filter(n => n.tabIndex >= 0);

			let index = tabbable.indexOf(document.activeElement);
			if (index === -1 && e.shiftKey) index = 0;

			index += tabbable.length + (e.shiftKey ? -1 : 1);
			index %= tabbable.length;

			tabbable[index].focus();
			e.preventDefault();
		}
	};
  </script>
  
  <style>
    .participants {
      display: flex;
      background-color: #D4F3EE;
      margin: 20px;
      padding: 10px;
      box-shadow: 4px 5px 13px 0px rgba(0,0,0,0.38);
      font-style: normal;
      font-weight: 600;
      font-size: 12px;
      line-height: 16px;
      color: #000000;
      flex-direction: column;
      justify-content: flex-start;
      position: absolute;
      right: 20px;
      z-index: 10;
    }
    .participant {
      display: flex;
      flex-direction: row;
      align-items: center;
    }
    .controls {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
      padding-left: 7px;
      padding-top: 5px;
    }
    .name {
      margin-left: 10px;
    }
  </style>

  <svelte:window on:keydown={handle_keydown}/>

  <!-- <div class="modal-background" on:click={close}></div> -->

  <div class='participants '>
    <div class='controls'>
      <div on:click={close}>
        <ExIcon />
      </div>
    </div>
    <h3> Participants:</h3>
    <div class="participant-list">
      {#each active as folk}
      <div class="participant">
        <holo-identicon hash={folk}></holo-identicon>
        <div class="name">
        {#if avatars[encodeHashToBase64(folk)]}
          {avatars[encodeHashToBase64(folk)].name}
        {:else} <i>no-name</i>
        {/if}
        </div>
      </div>
      {/each}
    </div>
  </div>