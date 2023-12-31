import { Component, For, JSXElement, Show, createSignal } from "solid-js";

import { Color } from "./colors";
import { identity } from "@/common";

type Props = {
	children: JSXElement;
	list: JSXElement[][];
	class?: string;
	color: Color;
	outline?: boolean;
};

const DropdownButton: Component<Props> = props => {
	const [visible, setVisible] = createSignal(false);
	return (
		<div class="dropdown">
			<button
				class={`btn btn-${props.outline ? "ol-" : ""}${props.color} ${
					props.class ?? ""
				}`}
				onClick={() => {
					setVisible(v => !v);
				}}>
				{props.children}
			</button>
			<div
				class={`dropdown-menu ${visible() ? "visible" : "hidden"}`}
				onClick={() => {
					setVisible(false);
				}}>
				<For each={props.list}>
					{(item, index) => (
						<>
							<Show when={index() > 0}>
								<hr />
							</Show>
							<For each={item}>{identity}</For>
						</>
					)}
				</For>
			</div>
		</div>
	);
};

export default DropdownButton;
