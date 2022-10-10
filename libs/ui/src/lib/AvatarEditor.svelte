<script>
    import ExIcon from './icons/ExIcon.svelte'
    import CheckIcon from './icons/CheckIcon.svelte'
  
    export let handleSave
    export let cancelEdit
    export let avatar

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
    .avatar-editor {
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
      width: 200px;
    }
    .textarea {
      background-color: rgba(255, 255, 255, 0.72);
      border: 1px solid #C9C9C9;
      box-sizing: border-box;
      border-radius: 3px;
      width: 100%;
    }
    .controls {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding-left: 7px;
      padding-top: 5px;
    }
    .modal-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.3);
    }

    .modal {
      position: absolute;
      left: 50%;
      top: 25%;
      width: calc(100vw - 4em);
      max-width: 32em;
      max-height: calc(100vh - 4em);
      overflow: auto;
      transform: translate(-50%,-50%);
      padding: 1em;
      border-radius: 0.2em;
    }

  </style>

  <svelte:window on:keydown={handle_keydown}/>

  <div class="modal-background" on:click={cancelEdit}></div>

  <div class='avatar-editor modal' aria-modal="true" bind:this={modal}>
    <div class='controls'>
      <div on:click={cancelEdit}>
        <ExIcon />
      </div>
      <div on:click={() => handleSave(avatar)}>
        <CheckIcon />
      </div>
    </div>
    <div class="edit-name">
      Name: <input class='textarea' bind:value={avatar.name} />
    </div>
  </div>