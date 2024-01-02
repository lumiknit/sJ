import { Component } from "solid-js";
import SJArea from "./components/SJArea";
import { State as SJState, defaultOptions, newState } from "./components/state";

const App: Component<{}> = () => {
	const sjState: SJState = newState(defaultOptions());
	return (
		<>
			<SJArea s={sjState} />
		</>
	);
};

export default App;
