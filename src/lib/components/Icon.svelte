<script>
  import icons from '../icons.json';
  let { name, size = 24, color = 'currentColor', weight = 'FILL', viewBox = '0 0 24 24', className = '', style = '' } = $props();
  const paths = $derived(icons[name] || [['']]);
</script>

<svg
  class={className}
  style={style}
  width={size}
  height={size}
  viewBox={viewBox}
  fill={color}
  role="img"
  aria-hidden="true"
  focusable="false"
>
  {#each paths as p}
    <path d={p[0] + (p[1] ? ' ' + p[1] : '')} {...(p[1] ? { transform: p[1] } : {})} />
  {/each}
</svg>
