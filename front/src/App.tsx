import { Component } from "solid-js";
import SJArea from "./components/SJArea";
import { State as SJState, defaultOptions, newState } from "./components/state";
import { Toaster } from "solid-toast";

const App: Component<{}> = () => {
	const sjState: SJState = newState(defaultOptions());
	return (
		<>
			<SJArea s={sjState} />
			<Toaster
				position="top-center"
				toastOptions={{
					className: "sj-toast",
				}}
			/>
		</>
	);
};

export default App;
