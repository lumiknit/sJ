import { Component, Match, Switch, createEffect, createSignal } from "solid-js";
import { State, appendToEditing, executeEditing } from "../state";

import { TbCaretLeft, TbCaretRight, TbRocket, TbSend } from "solid-icons/tb";
import InputCode, { ValueSignal } from "./InputCode";

type Props = {
	s: State;
};

const InputLine: Component<Props> = props => {
	const sig: ValueSignal = createSignal(["", 0, 0]);
	const [isEmpty, setIsEmpty] = createSignal(true);

	createEffect(() => {
		const [v] = sig[0]();
		setIsEmpty(v === "");
	});

	const handleCaretLeftClick = () => {
		alert("Unimplemented: handleCaretLeftClick");
	};
	const handleCaretRightClick = () => {
		alert("Unimplemented: handleCaretRightClick");
	};

	const handleSendClick = (): boolean => {
		const [v, ss, se] = sig[0]();
		if (v === "") {
			// Launch
			executeEditing(props.s);
			return true;
		} else {
			const code = v.slice(0, ss) + v.slice(se);
			const left = appendToEditing(props.s, code, false);
			sig[1]([left, left.length, left.length]);
			return left.length === 0;
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		const [v, ss, se] = sig[0]();
		if (
			(props.s.o.sendOnSep &&
				e.key === " " &&
				se === v.length &&
				v[ss - 1] === " ") ||
			e.key === "Enter"
		) {
			if (handleSendClick()) {
				e.preventDefault();
				return true;
			}
		}
	};

	return (
		<div class="sj-mi-w">
			<div class="sj-mi-ln">
				<button onClick={handleCaretLeftClick}>
					<TbCaretLeft />
				</button>
				<InputCode sig={sig} onKeyDown={handleKeyDown} />
				<button onClick={handleCaretRightClick}>
					<TbCaretRight />
				</button>
				<button onClick={handleSendClick}>
					<Switch>
						<Match when={isEmpty()}>
							<TbRocket />
						</Match>
						<Match when={true}>
							<TbSend />
						</Match>
					</Switch>
				</button>
			</div>
		</div>
	);
};

export default InputLine;
