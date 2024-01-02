import { Component } from "solid-js";

import { MainInput, MainInputState } from "./components/main-input";

const App: Component<{}> = () => {
	const mainInputState: MainInputState = {
		// ...
	};
	return (
		<>
			Hello, world!
			<MainInput s={mainInputState} />
		</>
	);
};

export default App;
