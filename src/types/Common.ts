import type { Component } from "vue";

export interface DropdownOption {
	label: string
	icon?: Component
	class?: string
	action: (selectedItem?: any) => void
}