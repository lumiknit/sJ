import { Component, Ref } from "solid-js";
import { State } from "./state";

import { TbCaretLeft, TbCaretRight, TbSend } from "solid-icons/tb";
import InputCode from "./InputCode";
import { describeResult, parse } from "@/core/parser";
import { convertToExpr } from "@/core/type";

type Props = {
	s: State;
};

const InputLine: Component<Props> = props => {
	const a = () => alert("a");
	let taRef: HTMLTextAreaElement;

	let lastparsed = [[]];

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === "Enter" && e.shiftKey) {
			const v = taRef.value;
			const result = parse(v, {}, lastparsed);
			if (describeResult(result) !== undefined) {
				// Not finished.
				console.log("Cont.d", result);
			} else {
				console.log("Finished", convertToExpr(result.out));
				lastparsed = [[]];
			}
			taRef.value = result.left;
			taRef.selectionStart = taRef.selectionEnd = result.left.length;
			e.preventDefault();
			return true;
		}
	};

	return (
		<div class="sj-mi-w">
			<div class="sj-mi-ln">
				<button onClick={a}>
					<TbCaretLeft />
				</button>
				<InputCode ref={taRef!} onKeyDown={handleKeyDown} />
				<button onClick={a}>
					<TbCaretRight />
				</button>
				<button onClick={a}>
					<TbSend />
				</button>
			</div>
		</div>
	);
};

export default InputLine;
