import { Component } from "solid-js";
import { State } from "../state";

type Props = {
	s: State;
	data: string;
};

const CodeInputCell: Component<Props> = props => {
	console.log(props.data);
	return <pre class="sj-c-e">{props.data}</pre>;
};

export default CodeInputCell;
