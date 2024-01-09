import { Component, For } from "solid-js";
import { Dynamic } from "solid-js/web";
import { CELL_TYPE_TO_COMPONENT, EditingCell } from "./cell";
import { MainInput } from "./main-input";
import { State } from "./state";

import { RightSidebarContainer } from "./r-sidebar";
import "./style.scss";

type Props = {
	s: State;
};

const SJArea: Component<Props> = props => {
	return (
		<div class="sja" ref={props.s.rootElem}>
			{/* Gap */}
			<div class="sja-g"></div>

			{/* Cells */}
			<div class="sja-cs">
				<For each={props.s.cells[0]()}>
					{cell => (
						<div class="sja-c">
							<Dynamic
								component={CELL_TYPE_TO_COMPONENT.get(
									cell[0]().type,
								)}
								data={cell[0]().data}
							/>
						</div>
					)}
				</For>
				<EditingCell s={props.s} />
			</div>

			{/* Bottom input */}
			<RightSidebarContainer />

			{/* Bottom input */}
			<MainInput s={props.s} />
		</div>
	);
};

export default SJArea;
