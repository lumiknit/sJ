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
	commitEditing,
	executeEditing,
	moveCursorAt,
	moveCursorOffset,
} from "../state";

import { addClickEvents } from "@/common";
import { TbCaretLeft, TbCaretRight, TbRocket, TbSend } from "solid-icons/tb";
import InputCode, { ValueSignal } from "./InputCode";
import toast from "solid-toast";
import { keyCodeToKey } from "@/common/key-map";

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
				moveCursorOffset(props.s, -1);
			},
			longClick: () => {
				moveCursorOffset(props.s, -1, true);
			},
		});
		addClickEvents(caretRightRef, {
			click: () => {
				moveCursorOffset(props.s, 1);
			},
			longClick: () => {
				moveCursorOffset(props.s, 1, true);
			},
		});
	});

	const getCurrentInput = (): [string, number, number] => {
		const miRef = props.s.miRef;
		if (miRef) {
			return [miRef.value, miRef.selectionStart, miRef.selectionEnd];
		}
		return sig[0]();
	};

	const handleSendClick = (commit?: boolean): boolean => {
		const [v, ss, se] = getCurrentInput();
		if (v === "") {
			(commit ? commitEditing : executeEditing)(props.s);
			return true;
		} else {
			const code = v.slice(0, ss) + v.slice(se);
			const left = appendToEditing(props.s, code, false);
			console.log(v, left);
			sig[1]([left, left.length, left.length]);
			return left.length === 0;
		}
	};

	const handleInput = (e: InputEvent) => {
		if (e.isComposing) return;
		const [v, ss, se] = getCurrentInput();
		const o = props.s.o[0]();
		if (
			ss === se &&
			se === v.length &&
			o.sendOnSep &&
			(v.endsWith("  ") || (o.spaceAsSep && v.endsWith(" ")))
		) {
			if (handleSendClick(true)) {
				e.preventDefault();
				return true;
			}
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		let ret = false;
		const handled = () => {
			ret = true;
			e.preventDefault();
		};
		const key = e.key || keyCodeToKey(e.keyCode);
		const [v, ss, se] = getCurrentInput();
		switch (key) {
			case "ArrowLeft":
				if (ss === se && ss === 0) {
					moveCursorOffset(props.s, -1, e.shiftKey);
					handled();
				}
				break;
			case "ArrowRight":
				if (ss === se && ss === v.length) {
					moveCursorOffset(props.s, 1, e.shiftKey);
					handled();
				}
				break;
			case "Home":
				if (ss === se && ss === 0) {
					moveCursorAt(props.s, 0, e.shiftKey);
					handled();
				}
				break;
			case "End":
				if (ss === se && ss === v.length) {
					moveCursorAt(props.s, Infinity, e.shiftKey);
					handled();
				}
				break;
			case "Backspace":
				if (ss === se && ss === 0) {
					backspaceToken(props.s);
					handled();
				}
				break;
			case "Enter":
				if (handleSendClick(true)) {
					handled();
				}
				break;
		}
		return ret;
	};

	return (
		<div class="sj-mi-w">
			<div class="sj-mi-ln">
				<button ref={caretLeftRef!} tabIndex={-1}>
					<TbCaretLeft />
				</button>
				<InputCode
					ref={props.s.miRef}
					sig={sig}
					onKeyDown={handleKeyDown}
					onInput={handleInput}
				/>
				<button ref={caretRightRef!} tabIndex={-1}>
					<TbCaretRight />
				</button>
				<button onClick={() => handleSendClick()}>
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
