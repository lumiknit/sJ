import { Component, Show, createSignal } from "solid-js";
import ToggleButton from "./ToggleButton";

type Props = {};

const Container: Component<Props> = props => {
	const [open, setOpen] = createSignal(false);
	const toggleOpen = () => setOpen(!open);
	return (
		<div class="sj-rs">
			<ToggleButton open={open()} toggle={toggleOpen} />
			<Show when={open()}>Contents</Show>
		</div>
	);
};

export default Container;
