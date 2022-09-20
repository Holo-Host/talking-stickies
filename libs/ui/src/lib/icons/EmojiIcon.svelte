<script lang="ts">
export let emoji: string
let className = ''
  export { className as class }
</script>
<style>
  .icon-size {
    font-size: 16px;
  }
  .vote-icon {
    margin-right: 2px;
  }
</style>
<div class="icon-size {className}">{emoji}</div>
