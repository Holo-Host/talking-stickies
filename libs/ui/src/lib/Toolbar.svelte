<script>
  import LogoIcon from "./icons/LogoIcon.svelte";
  export let title = ""

</script>

<style>
  .toolbar {
    display: flex;
    align-items: center;
    height: 70px;
  }
  .logo {
    width: 40px;
    margin-right: 10px;
    display: contents;
  }
  .logo-text {
    padding-bottom: 5px;
  }
</style>

<div class='toolbar'>
  <div class="logo"><LogoIcon /></div><h1 class="logo-text">{title}</h1>
</div>
