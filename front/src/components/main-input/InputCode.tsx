import { Component, Ref, type JSX, onMount } from "solid-js";
import { Portal } from "solid-js/web";

type TATarget = {
	target: Element;
	currentTarget: HTMLTextAreaElement;
};

const lineStart = (content: string, p: number) =>
	content.lastIndexOf("\n", p) + 1;

const interleave = (str: string, s: number, e: number, ins: string) =>
	str.slice(0, s) + ins + str.slice(e);

const indentTextareaContent = (
	content: string,
	start: number,
	end: number,
): [string, number, number] => {
	// Indent selection and return new value and range
	const s = lineStart(content, start),
		lines = content.slice(s, end).split("\n");
	return [
		interleave(content, s, end, "  " + lines.join("\n  ")),
		start + 2,
		end + 2 * lines.length,
	];
};

const outdentTextareaContent = (
	content: string,
	originalStart: number,
	originalEnd: number,
): [string, number, number] => {
	// Outdent selection and return new value and start and end
	const s = lineStart(content, originalStart);
	let start = originalStart,
		end = originalEnd;
	const lines = content
		.slice(s, originalEnd)
		.split("\n")
		.map((s, i) => {
			const c = s.startsWith("  ") ? 2 : s.startsWith("\t") ? 1 : 0;
			if (i === 0) start -= c;
			end -= c;
			return s.slice(c);
		});
	return [interleave(content, s, originalEnd, lines.join("\n")), start, end];
};

export type CodeProps = {
	class?: string;
	value?: string;
	ref?: Ref<HTMLTextAreaElement>;

	onChange?: (e: TATarget & Event) => boolean | undefined;
	onInput?: (e: TATarget & InputEvent) => boolean | undefined;
	onKeyDown?: (e: TATarget & KeyboardEvent) => boolean | undefined;
};

const InputCode: Component<CodeProps> = props => {
	let taRef: HTMLTextAreaElement;
	let hiddenRef: HTMLTextAreaElement;

	const hackRef = (ref: HTMLTextAreaElement) => {
		taRef! = ref;
		if (typeof props.ref === "function") props.ref(ref);
	};

	const resizeTextarea = (textarea: HTMLTextAreaElement) => {
		hiddenRef.value = textarea.value;
		hiddenRef.style.width = `${textarea.clientWidth}px`;
		textarea.style.height = hiddenRef.scrollHeight + "px";
	};

	onMount(() => resizeTextarea(taRef));

	const onKeyDown: JSX.EventHandlerUnion<
			HTMLTextAreaElement,
			KeyboardEvent
		> = event => {
			if (props.onKeyDown && props.onKeyDown(event)) return;
			const target = event.currentTarget;
			switch (event.key) {
				// Tab key
				case "Tab":
					{
						event.preventDefault();
						const indentResult = (
							event.shiftKey
								? outdentTextareaContent
								: indentTextareaContent
						)(
							target.value,
							target.selectionStart,
							target.selectionEnd,
						);
						target.value = indentResult[0];
						target.selectionStart = indentResult[1];
						target.selectionEnd = indentResult[2];
						resizeTextarea(
							event.currentTarget as HTMLTextAreaElement,
						);
					}
					break;
				case "Enter":
					{
						// Enter key
						event.preventDefault();
						const target = event.currentTarget,
							start = target.selectionStart,
							value = target.value;
						// Get previous line indent
						const re = /[ \t]*/y;
						re.lastIndex = lineStart(value, start - 1);
						const indent = re.exec(value)?.[0] ?? "";
						target.value = interleave(
							value,
							start,
							target.selectionEnd,
							"\n" + indent,
						);
						target.selectionStart = target.selectionEnd =
							start + 1 + indent.length;
						resizeTextarea(event.target as HTMLTextAreaElement);
					}
					break;
			}
		},
		onInput: JSX.EventHandlerUnion<
			HTMLTextAreaElement,
			InputEvent
		> = event => {
			if (props.onInput && props.onInput(event)) return;
			resizeTextarea(event.target as HTMLTextAreaElement);
		},
		onFocus: JSX.EventHandler<HTMLTextAreaElement, Event> = event => {
			resizeTextarea(event.currentTarget as HTMLTextAreaElement);
		};

	return (
		<>
			<textarea
				ref={hackRef}
				class={`mi-code ${props.class}`}
				value={props.value ?? ""}
				placeholder="[ sJ ]"
				onFocus={onFocus}
				onChange={props.onChange}
				onInput={onInput}
				onKeyDown={onKeyDown}
			/>
			<Portal>
				<textarea
					ref={hiddenRef!}
					disabled
					class={`mi-code hidden ${props.class}`}
				/>
			</Portal>
		</>
	);
};

export default InputCode;
