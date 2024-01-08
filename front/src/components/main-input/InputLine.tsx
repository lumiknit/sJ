import { Component, Match, Switch, createEffect, createSignal } from "solid-js";
import {
	State,
	appendToEditing,
	backspaceToken,
	executeEditing,
	moveCursorLeft,
	moveCursorRight,
} from "../state";

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
		moveCursorLeft(props.s);
	};
	const handleCaretRightClick = () => {
		moveCursorRight(props.s);
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
		switch (e.key) {
			case "ArrowLeft":
				if (ss === se && ss === 0) {
					moveCursorLeft(props.s);
					e.preventDefault();
					return true;
				}
				break;
			case "ArrowRight":
				if (ss === se && ss === v.length) {
					moveCursorRight(props.s);
					e.preventDefault();
					return true;
				}
				break;
			case "Backspace":
				if (ss === se && ss === 0) {
					e.preventDefault();
					backspaceToken(props.s);
					return true;
				}
				break;
		}
		if (
			(props.s.o.sendOnSep &&
				e.key === " " &&
				se === v.length &&
				(props.s.o.spaceAsSep || v[ss - 1] === " ")) ||
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
				<InputCode
					ref={props.s.miRef}
					sig={sig}
					onKeyDown={handleKeyDown}
				/>
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
