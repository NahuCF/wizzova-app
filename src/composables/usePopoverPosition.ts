import { nextTick, type Ref } from "vue"

type Side = 'top' | 'bottom' | 'left' | 'right'
type VerticalAlign = 'top' | 'bottom'
type HorizontalAlign = 'left' | 'center' | 'right'

interface PositionOptions {
	position?: Side
	offsetX?: number
	offsetY?: number
	alignVertical?: VerticalAlign
	alignHorizontal?: HorizontalAlign
}

export const usePopoverPosition = (popoverRef: Ref<any>, target?: HTMLElement) => {
	const positionPopover = async({
		position = 'right',
		offsetX = 0,
		offsetY = 0,
		alignVertical = 'top',
		alignHorizontal = 'left'
	}: PositionOptions = {}) => {
		await nextTick()

		const popoverEl: HTMLElement | undefined = popoverRef?.value?.container
		const targetEl: HTMLElement | undefined = target || popoverRef?.value?.target
		if (!popoverEl || !targetEl) return

		const rect = targetEl.getBoundingClientRect()
		const popRect = popoverEl.getBoundingClientRect()

		switch (position) {
			case 'left': {
				let top = rect.top
				if (alignVertical === 'bottom') {
					popoverEl.style.transformOrigin = 'center bottom 0px'
					top = rect.bottom - popoverEl.offsetHeight
				}

				popoverEl.style.top = `${top + offsetY}px`
				popoverEl.style.left = `${rect.left - popRect.width + offsetX}px`
				break
			}

			case 'right': {
				let top = rect.top
				if (alignVertical === 'bottom') {
					popoverEl.style.transformOrigin = 'center bottom 0px'
					top = rect.bottom - popoverEl.offsetHeight
				}

				popoverEl.style.top = `${top + offsetY}px`
				popoverEl.style.left = `${rect.right + offsetX}px`
				
				break
			}

			case 'top': {
				let left = rect.left
				if (alignHorizontal === 'center') left = rect.left + rect.width / 2 - popRect.width / 2
				else if (alignHorizontal === 'right') left = rect.right - popRect.width

				popoverEl.style.top = `${rect.top - popRect.height + offsetY}px`
				popoverEl.style.left = `${left + offsetX}px`
				break
			}

			case 'bottom':
			default: {
				let left = rect.left
				if (alignHorizontal === 'center') left = rect.left + rect.width / 2 - popRect.width / 2
				else if (alignHorizontal === 'right') left = rect.right - popRect.width

				popoverEl.style.top = `${rect.bottom + offsetY}px`
				popoverEl.style.left = `${left + offsetX}px`
				break
			}
		}
	}

	return { positionPopover }
}