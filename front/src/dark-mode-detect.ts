// Query dark mode

(() => {
	let timeout = 10;
	const updateThemeColor = () => {
		const bgColor = getComputedStyle(
			document.documentElement,
		).getPropertyValue("--sj-c-bg");
		if (bgColor) {
			// Set theme color
			document
				.querySelector('meta[name="theme-color"]')
				?.setAttribute("content", bgColor);
		}
		if (timeout < 10000) {
			timeout *= 4;
			setTimeout(updateThemeColor, timeout);
		}
	};

	const onChangeDarkMode = (isDarkMode: boolean) => {
		document.documentElement.setAttribute(
			"color-theme",
			isDarkMode ? "dark" : "light",
		);
		setTimeout(updateThemeColor);
	};

	const match = matchMedia("(prefers-color-scheme: dark)");
	match.addEventListener("change", e => onChangeDarkMode(e.matches));
	onChangeDarkMode(match.matches);

	addEventListener("load", updateThemeColor);
})();
