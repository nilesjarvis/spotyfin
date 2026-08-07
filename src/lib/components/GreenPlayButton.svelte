<script>
  import Icon from './Icon.svelte';
  let { size = 48, onclick, ...rest } = $props();
</script>

<button class="gpb" style="width:{size}px; height:{size}px;" {onclick} {...rest}>
  <Icon name="play" size={size*0.62} style="fill:#000; transform: translateX({size*0.04}px)" />
</button>

<style>
  .gpb { border-radius:50%; background: var(--green); color:#000; display:flex; align-items:center; justify-content:center; box-shadow: 0 8px 20px rgba(0,0,0,0.4); transition: transform 0.1s ease, background 0.1s; flex:0 0 auto; }
  .gpb:hover { background: var(--green-hover); transform: scale(1.05); }
</style>
