import {
	TbLayoutSidebarRightCollapse,
	TbLayoutSidebarRightExpand,
} from "solid-icons/tb";
import { Component } from "solid-js";

type Props = {
	open: boolean;
	toggle: () => void;
};

const ToggleButton: Component<Props> = props => {
	return (
		<button class="rs-btn-tg" onClick={props.toggle}>
			{props.open ? (
				<TbLayoutSidebarRightCollapse />
			) : (
				<TbLayoutSidebarRightExpand />
			)}
		</button>
	);
};

export default ToggleButton;
