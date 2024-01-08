import { Component, For, JSX, Match, Switch, createEffect } from "solid-js";
import { State, moveCursorAt } from "../state";
import { Token, Tokens } from "@/core/token";

import "./EditingCell.scss";
import { COMMENT_PREFIX, STRING_PREFIX } from "@/core/parser";
import { Dynamic } from "solid-js/web";

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
		console.log(props.idx);
		moveCursorAt(props.s, props.idx + o);
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
				<span
					classList={{
						"sj-c-et": true,
						"t-comment": true,
						marked: props.marked,
					}}
					onClick={handleClick}>
					# {v.slice(1)}
					<br />
				</span>
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
	return <Dynamic component={choose(props.token)} {...props} />;
};

type TokensProps = {
	s: State;
	off: number;
	cur: number;
	tokens: Tokens;
};

const TokensComponent: Component<TokensProps> = props => {
	return (
		<>
			<For each={props.tokens}>
				{(token, idx) => (
					<>
						<TokenComponent
							s={props.s}
							idx={idx() + props.off}
							marked={props.cur <= idx() + props.off}
							token={token}
						/>
						&nbsp;
					</>
				)}
			</For>
		</>
	);
};

type Props = {
	s: State;
};

const EditingCell: Component<Props> = props => {
	createEffect(() => {
		console.log(props.s.e[0]());
	});
	return (
		<div class="sj-c-e">
			<TokensComponent
				s={props.s}
				off={0}
				cur={props.s.e[0]().ez[2] ?? Infinity}
				tokens={props.s.e[0]().ez[0]}
			/>

			<span class="cursor"> &nbsp; </span>

			<TokensComponent
				s={props.s}
				off={props.s.e[0]().ez[0].length}
				cur={props.s.e[0]().ez[2] ?? Infinity}
				tokens={Array.from(props.s.e[0]().ez[1]).reverse()}
			/>
		</div>
	);
};

export default EditingCell;
