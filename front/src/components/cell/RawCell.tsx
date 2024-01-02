import { Component } from "solid-js";

import "./RawCell.scss";

type Props = {
	data: string;
};

const RawCell: Component<Props> = props => {
	return <div class="sjc-raw">{props.data}</div>;
};

export default RawCell;
