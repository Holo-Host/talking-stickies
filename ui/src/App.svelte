<script lang="ts">
  import Syn from './Syn.svelte'
  import Board from './Board.svelte'
  import Toolbar from './Toolbar.svelte'
  import { scribeStr } from './stores.js'

  $: noscribe = $scribeStr === ''
  let syn

  $: agentPubkey = ''

  function setAgentPubkey (newAgentPubkey) {
    console.log('setting agent pubkey', newAgentPubkey)
    agentPubkey = newAgentPubkey
  }

  $: sortOption = null

  function setSortOption (newSortOption) {
    console.log('setting sort option', newSortOption)
    sortOption = newSortOption
  }

  // The debug drawer's ability to resized and hidden
  let resizeable
  let resizeHandle
  const minDrawerSize = 0
  const maxDrawerSize = document.documentElement.clientHeight - 30 - 10
  const initResizeable = (resizeableEl) => {
    resizeableEl.style.setProperty('--max-height', `${maxDrawerSize}px`)
    resizeableEl.style.setProperty('--min-height', `${minDrawerSize}px`)
  }

  const setDrawerHeight = (height) => {
    document.documentElement.style.setProperty('--resizeable-height', `${height}px`)
  }
  const getDrawerHeight = () => {
    const pxHeight = getComputedStyle(resizeable)
      .getPropertyValue('--resizeable-height')
    return parseInt(pxHeight, 10)
  }

  const startDragging = (event) => {
    event.preventDefault()
    const host = resizeable
    const startingDrawerHeight = getDrawerHeight()
    const yOffset = event.pageY

    const mouseDragHandler = (moveEvent) => {
      moveEvent.preventDefault()
      const primaryButtonPressed = moveEvent.buttons === 1
      if (!primaryButtonPressed) {
        setDrawerHeight(Math.min(Math.max(getDrawerHeight(), minDrawerSize), maxDrawerSize))
        window.removeEventListener('pointermove', mouseDragHandler)
        return
      }
      setDrawerHeight(Math.min(Math.max((yOffset - moveEvent.pageY ) + startingDrawerHeight, minDrawerSize), maxDrawerSize))
    }
    const remove = window.addEventListener('pointermove', mouseDragHandler)
  }

  let drawerHidden = true
  const hideDrawer = () => {
    drawerHidden = true
  }
  const showDrawer = () => {
    drawerHidden = false
  }

  let tabShown = false;
  const showTab = () => {
    tabShown = true
  }
  const hideTab = () => {
    tabShown = false
  }

</script>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 1000px;
  }
	main {
		padding: 1em;
    background: hsla(100, 20%, 50%, .2);
    grid-column: 1 / 2;
	}

  :global(:root) {
    --resizeable-height: 200px;
    --tab-width: 60px;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
    margin: auto;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<svelte:head>
  <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
</svelte:head>

<div class='app'>
  <Toolbar setSortOption={setSortOption} sortOption={sortOption} />
  <Board
    on:requestChange={(event) => syn.requestChange(event.detail)}
    agentPubkey={agentPubkey}
    sortOption={sortOption} />
  <Syn bind:this={syn} setAgentPubkey={setAgentPubkey} />
</div>