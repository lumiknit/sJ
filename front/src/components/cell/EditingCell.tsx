import { Token, Tokens } from "@/core/token";
import { Component, For, JSX, Show } from "solid-js";
import {
	State,
	copySelectedEditing,
	cutSelectedEditing,
	moveCursorAt,
	pasteEditing,
	toggleSpaceAsSep,
} from "../state";

import { COMMENT_PREFIX, STRING_PREFIX } from "@/core";
import {
	TbClipboard,
	TbCopy,
	TbCut,
	TbSeparator,
	TbWriting,
} from "solid-icons/tb";
import { Dynamic } from "solid-js/web";
import "./EditingCell.scss";
import toast from "solid-toast";

type TokenProps = {
	s: State;
	idx: number;
	marked: boolean;
	token: Token;
};

const TokenComponent: Component<TokenProps> = props => {
	const handleClick: JSX.EventHandlerUnion<
		HTMLSpanElement,
		MouseEvent
	> = e => {
		const r = e.target.getBoundingClientRect();
		const x = e.clientX;
		const o = x - r.left < r.width / 2 ? 0 : 1;
		const km = e.shiftKey ? e.shiftKey : undefined;
		moveCursorAt(props.s, props.idx + o, km);
		e.preventDefault();
	};

	const handleSpaceClick: JSX.EventHandlerUnion<
		HTMLSpanElement,
		MouseEvent
	> = e => {
		const km = e.shiftKey ? e.shiftKey : undefined;
		moveCursorAt(props.s, props.idx + 1, km);
		e.preventDefault();
	};

	const choose = (v: Token): Component<TokenProps> => {
		if (typeof v === "number")
			return props => (
				<span
					classList={{
						"sj-c-et": true,
						"t-num": true,
						marked: props.marked,
					}}
					onClick={handleClick}>
					{v}
				</span>
			);
		if (v.startsWith(COMMENT_PREFIX))
			return props => (
				<>
					<Show when={v.length > 1}>
						<span
							classList={{
								"sj-c-et": true,
								"t-comment": true,
								marked: props.marked,
							}}
							onClick={handleClick}>
							# {v.slice(1)}
						</span>
					</Show>
					<br />
				</>
			);
		if (v.startsWith(STRING_PREFIX))
			return props => (
				<span
					classList={{
						"sj-c-et": true,
						"t-str": true,
						marked: props.marked,
					}}
					onClick={handleClick}>
					"{v.slice(1)}"
				</span>
			);
		return props => (
			<span
				classList={{
					"sj-c-et": true,
					marked: props.marked,
				}}
				onClick={handleClick}>
				{v}
			</span>
		);
	};
	return (
		<>
			<Dynamic component={choose(props.token)} {...props} />
			<span
				classList={{
					"sj-c-etsp": true,
					marked: props.marked,
				}}
				onClick={handleSpaceClick}>
				&nbsp;
			</span>
		</>
	);
};

type TokensProps = {
	s: State;
	off: number;
	left: boolean;
	cur: number;
	tokens: Tokens;
};

const TokensComponent: Component<TokensProps> = props => {
	return (
		<For each={props.tokens}>
			{(token, idx) => (
				<TokenComponent
					s={props.s}
					idx={idx() + props.off}
					marked={props.left == props.cur <= idx() + props.off}
					token={token}
				/>
			)}
		</For>
	);
};

type Props = {
	s: State;
};

const EditingCell: Component<Props> = props => {
	const cur = () => props.s.e[0]().ez[2] ?? props.s.e[0]().ez[0].length;

	const handleCut = () => {
		if (cutSelectedEditing(props.s)) {
			toast.success("Cut to clipboard");
		} else {
			toast.error("Nothing selected");
		}
	};

	const handleCopy = () => {
		if (copySelectedEditing(props.s)) {
			toast.success("Copied to clipboard");
		} else {
			toast.error("Nothing selected");
		}
	};

	const handlePaste = async () => {
		if (await pasteEditing(props.s)) {
			toast.success("Pasted from clipboard");
		} else {
			toast.error("Nothing to paste");
		}
	};

	const handleToggleSpaceAsSep = () => {
		if (toggleSpaceAsSep(props.s)) {
			toast("Space is now separator");
		} else {
			toast("Space is not separator anymore");
		}
	};

	return (
		<>
			<div class="sj-c-e-tools">
				<button class="sj-ce-tb" onClick={handleCut}>
					<TbCut /> Cut
				</button>
				<button class="sj-ce-tb" onClick={handleCopy}>
					<TbCopy /> Copy
				</button>
				<button class="sj-ce-tb" onClick={handlePaste}>
					<TbClipboard /> Paste
				</button>
				<button
					classList={{
						"sj-ce-tb": true,
						inactive: !props.s.o[0]().spaceAsSep,
					}}
					onClick={handleToggleSpaceAsSep}>
					<TbSeparator /> '&nbsp;'='_'
				</button>
			</div>
			<div class="sj-c-e">
				<TokensComponent
					s={props.s}
					off={0}
					left
					cur={cur()}
					tokens={props.s.e[0]().ez[0]}
				/>

				<span class="cursor"> &nbsp; </span>

				<TokensComponent
					s={props.s}
					off={props.s.e[0]().ez[0].length}
					left={false}
					cur={cur()}
					tokens={Array.from(props.s.e[0]().ez[1]).reverse()}
				/>

				<TbWriting class="sj-c-e-ic" />
			</div>
		</>
	);
};

export default EditingCell;
