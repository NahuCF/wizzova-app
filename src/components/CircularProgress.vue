<template>
	<svg :width="size" :height="size" viewBox="0 0 100 100" ref="svgRef">
		<circle cx="50" cy="50" :r="radius" :stroke-width="strokeWidth" stroke="#e5e7eb" fill="none" />
		<path ref="progressPath" fill="none" stroke="#10b981" :stroke-width="strokeWidth" stroke-linecap="butt"
			transform="translate(50,50)" />
	</svg>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, defineProps } from 'vue'
import * as d3 from 'd3'

const props = defineProps({
	progress: {
		type: Number,
		required: true,
		validator: (v: number) => v >= 0 && v <= 100
	},
	size: {
		type: Number,
		default: 28,
	},
	strokeWidth: {
		type: Number,
		default: 10,
	},
	duration: {
		type: Number,
		default: 750,
	},
})

const svgRef = ref<SVGSVGElement | null>(null)
const progressPath = ref<SVGPathElement | null>(null)

const radius = 50 - props.strokeWidth / 2

const arcGenerator = d3.arc()
	.innerRadius(radius)
	.outerRadius(radius)
	.startAngle(0)

function updateArc(progress: number, oldProgress: number | null = null) {
	if (!progressPath.value) return

	const endAngle = (progress / 100) * 2 * Math.PI
	const startAngle = 0

	if (oldProgress === null) {
		const d = arcGenerator({
			startAngle,
			endAngle,
			innerRadius: radius,
			outerRadius: radius,
		})!
		progressPath.value.setAttribute('d', d)
	} else {
		const interp = d3.interpolate(
			(oldProgress / 100) * 2 * Math.PI,
			endAngle
		)

		d3.select(progressPath.value)
			.transition()
			.duration(props.duration)
			.attrTween('d', () => (t) => {
				const currentAngle = interp(t)
				return arcGenerator({
					startAngle,
					endAngle: currentAngle,
					innerRadius: radius,
					outerRadius: radius,
				})!
			})
	}
}

onMounted(() => {
	updateArc(props.progress)
})

watch(() => props.progress, (newVal, oldVal) => {
	updateArc(newVal, oldVal ?? null)
})
</script>
