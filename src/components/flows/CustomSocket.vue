<template>
	<div class="socket" :title="data.name"></div>
</template>

<script>
export default {
	props: ['data']
}
</script>

<style lang="css" scoped>
.socket {
	display: inline-block;
	cursor: pointer;
	border: 1px solid grey;
	width: 16px;
	height: 32px;
	vertical-align: middle;
	background: #fff;
	z-index: 2;
	box-sizing: border-box;

	&:hover {
		background: #ddd;
	}
}
</style>
