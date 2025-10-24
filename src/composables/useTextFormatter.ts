
export const useTextFormatter = () => {
	const getPreviewText = (text: string) => {
		// variables
		return text
			.replace(/{{\s*([\w.]+)\s*}}/g, (_m, v) =>
				`<mark class='px-1 bg-slate-100 text-green-700 font-semibold'>${v}</mark>`
			)
			// bold/italic/strike/new line
			.replace(/\*(.*?)\*/g, (_m, v) => `<b>${v}</b>`)
			.replace(/_(.*?)_/g, (_m, v) => `<em>${v}</em>`)
			.replace(/~(.*?)~/g, (_m, v) => `<s>${v}</s>`)
			.replace(/\n/g, '<br>')
	}

	return {
		getPreviewText
	}
}