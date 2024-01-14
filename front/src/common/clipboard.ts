// Clipboard helpers

export let saveString: (value: string) => void;
export let loadString: () => Promise<string>;

// Check clipboard is supported
if (
	navigator.clipboard !== undefined &&
	navigator.clipboard.readText !== undefined &&
	navigator.clipboard.writeText !== undefined
) {
	// Clipboard API is supported
	saveString = (value: string) => {
		// Save the value into the clipboard
		navigator.clipboard.writeText(value);
	};
	loadString = () => {
		// Load the value from the clipboard
		return navigator.clipboard.readText();
	};
} else {
	let clipboard: string = "";
	// Clipboard API is not supported
	saveString = (value: string) => {
		// Save the value into the clipboard
		clipboard = value;
	};
	loadString = () => {
		// Load the value from the clipboard
		return Promise.resolve(clipboard);
	};
}
