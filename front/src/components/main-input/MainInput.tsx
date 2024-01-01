import { Component } from "solid-js";
import { State } from "./state";
import InputLine from "./InputLine";

type Props = {
	s: State;
};

const MainInput: Component<Props> = props => {
	return (
		<div class="sj-bi">
			<div class="sj-bi-i">
				<div class="badges w-100"></div>
				<InputLine s={props.s} />
			</div>
		</div>
	);
};

export default MainInput;
