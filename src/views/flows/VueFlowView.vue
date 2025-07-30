<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTestBotFlow } from '~/composables/useTestBotFlow'

const {
	questionsInput,
	messagesInput,
	testCases,
	currentTestIndex,
	currentFlowWithLayout,
	runTest,
} = useTestBotFlow()

const editorKey = ref(0)

watch([questionsInput, messagesInput], () => {
	currentTestIndex.value = -1
})

watch(
	[currentTestIndex, questionsInput, messagesInput],
	() => {
		editorKey.value++
		runTest(currentTestIndex.value)
	}
)
</script>

<template>
	<div class="mb-4">
		<label>
			Questions:
			<input type="number" v-model.number="questionsInput" min="1" />
		</label>
		<label class="ml-4">
			Messages per Question:
			<input type="number" v-model.number="messagesInput" min="1" />
		</label>
	</div>

	<div class="mb-4">
		<label>
			Quick Tests:
			<select v-model.number="currentTestIndex" @change="runTest(currentTestIndex)">
				<option :value="-1" disabled>Select a test case</option>
				<option v-for="(test, i) in testCases" :key="i" :value="i">
					Questions: {{ test.questions }}, Messages: {{ test.messages }}
				</option>
			</select>
		</label>
	</div>

	<div class="h-[600px] border rounded overflow-hidden">

		<VueFlowEditor 
			:key="editorKey"
			:nodes="currentFlowWithLayout.nodes" 
			:edges="currentFlowWithLayout.edges" 
			fit-view
			class="w-full h-full" />
	</div>
</template>
