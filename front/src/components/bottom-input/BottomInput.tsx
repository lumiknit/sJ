import { Button, InputGroup, InputText } from "@/brick";
import { Component } from "solid-js";

type Props = {};

const BottomInput: Component<Props> = props => {
	return (
		<div class="sj-bi">
			<div class="sj-bi-i">
				<div class="badges w-100">
					<Button color="primary" small>
						abc
					</Button>
				</div>

				<div class="input-line">
					<input type="text" />
					<button class=""> Up </button>
				</div>
			</div>
		</div>
	);
};

export default BottomInput;
