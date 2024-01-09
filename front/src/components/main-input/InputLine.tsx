import {
	Component,
	Match,
	Switch,
	createEffect,
	createSignal,
	onMount,
} from "solid-js";
import {
	State,
	appendToEditing,
	backspaceToken,
	executeEditing,
	moveCursorLeft,
	moveCursorRight,
} from "../state";

import { addClickEvents } from "@/common";
import { TbCaretLeft, TbCaretRight, TbRocket, TbSend } from "solid-icons/tb";
import InputCode, { ValueSignal } from "./InputCode";

type Props = {
	s: State;
};

const InputLine: Component<Props> = props => {
	const sig: ValueSignal = createSignal(["", 0, 0]);
	const [isEmpty, setIsEmpty] = createSignal(true);

	let caretLeftRef: HTMLButtonElement;
	let caretRightRef: HTMLButtonElement;

	createEffect(() => {
		const [v] = sig[0]();
		setIsEmpty(v === "");
	});

	onMount(() => {
		addClickEvents(caretLeftRef, {
			click: () => {
				moveCursorLeft(props.s);
			},
			longClick: () => {
				moveCursorLeft(props.s, true);
			},
		});
		addClickEvents(caretRightRef, {
			click: () => {
				moveCursorRight(props.s);
			},
			longClick: () => {
				moveCursorRight(props.s, true);
			},
		});
	});

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
		let [v, ss, se] = sig[0]();
		const miRef = props.s.miRef;
		if (miRef) {
			v = miRef.value;
			ss = miRef.selectionStart;
			se = miRef.selectionEnd;
		}
		switch (e.key) {
			case "ArrowLeft":
				if (ss === se && ss === 0) {
					moveCursorLeft(props.s, e.shiftKey);
					e.preventDefault();
					return true;
				}
				break;
			case "ArrowRight":
				if (ss === se && ss === v.length) {
					moveCursorRight(props.s, e.shiftKey);
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
				<button ref={caretLeftRef!}>
					<TbCaretLeft />
				</button>
				<InputCode
					ref={props.s.miRef}
					sig={sig}
					onKeyDown={handleKeyDown}
				/>
				<button ref={caretRightRef!}>
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
