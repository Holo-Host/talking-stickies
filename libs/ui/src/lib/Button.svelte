<script lang='ts'>
	// @ts-nocheck
	let buttonProps = {
	class:[$$restProps.class]
	}
</script>
	<button on:click
			on:mouseover
			on:mouseenter
			on:mouseleave
		{...buttonProps}>
			<slot/>
	</button>

<style>
    button {
        border-radius: 3px;
        margin-left: 5px;
    }
	.primary{
		color:white;
        background-color: lightskyblue;
	}
	.secondary{
		color:black;
	}
	.danger {
		color:red;
	}
	.sm {
		font-size:1em;
		padding:0.1em;
	}
	.lg {
		font-size:2em
	}
</style>