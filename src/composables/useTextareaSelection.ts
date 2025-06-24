import type { Ref } from 'vue'

export function useTextareaSelection(
  textareaRef: Ref<{
		$el: HTMLTextAreaElement
	} | null>,
  text: Ref<string>
) {
	const getNativeTextarea = (): HTMLTextAreaElement | null => {
    return textareaRef.value?.$el ?? null
  }

  const getSelection = () => {
    const el = getNativeTextarea()
    if (!el) return null
    return {
      start: el.selectionStart,
      end: el.selectionEnd,
      selectedText: text.value.slice(el.selectionStart, el.selectionEnd),
    }
  }

  const wrapSelection = (beforeText: string, afterText = '') => {
		const el = getNativeTextarea()
		if (!el) return

		const start = el.selectionStart
		const end = el.selectionEnd
		const selected = text.value.slice(start, end)

		text.value =
			text.value.slice(0, start) +
			beforeText +
			selected +
			afterText +
			text.value.slice(end)

		requestAnimationFrame(() => {
			el.focus()
			el.selectionStart = start
			el.selectionEnd = start + beforeText.length + selected.length + afterText.length
		})
	}

  return {
    getSelection,
    wrapSelection,
  }
}
