import { describeResult, parse } from "@/core/parser";
import { Expr, ParseOutput, convertToExpr } from "@/core/type";
import { Signal, createSignal } from "solid-js";

export type Options = {
	spaceAsSep?: boolean;
	sendOnSep?: boolean;
};

export const defaultOptions = (): Options => ({
	spaceAsSep: false,
	sendOnSep: true,
});

export type EditingState = {
	out: Expr;
	cursor: number[];
};

export type Cell = {
	type: string;
	data: any;
};

export type State = {
	// Root reference
	rootElem?: HTMLDivElement;

	scrollTO?: number;

	// Editings
	e: Signal<EditingState>;
	lastParsed: ParseOutput;
	eMsg?: string;

	// Cells
	cells: Signal<Signal<Cell>[]>;

	// Options
	o: Options;
};

// Constructor

export const newState = (options: Options): State => {
	return {
		e: createSignal<EditingState>({
			out: [],
			cursor: [0],
		}),
		lastParsed: [[]],
		cells: createSignal<Signal<Cell>[]>([]),
		o: options,
	};
};

// Private Methods

const scrollTo = (state: State, top: number) => {
	if (state.scrollTO) {
		clearTimeout(state.scrollTO);
	}
	let cnt = 0;
	const to = setInterval(() => {
		const acc = 0.5;
		const currTop = state.rootElem?.scrollTop || 0;
		let nextTop = Math.floor(currTop * (1 - acc) + top * acc);
		if (Math.abs(nextTop - top) <= 10 || ++cnt > 8) {
			clearInterval(to);
			nextTop = top;
		}
		state.rootElem?.scrollTo(0, nextTop);
	}, 16);
	state.scrollTO = to;
};

const scrollToBottom = (state: State) => {
	if (state.rootElem) {
		console.log(state.rootElem.scrollTop, state.rootElem.scrollHeight);
		scrollTo(state, state.rootElem.scrollHeight);
	}
};

const pushRawCell = (state: State, data: string) => {
	state.cells[1](cs => [...cs, createSignal({ type: "raw", data })]);
	scrollToBottom(state);
};

// Methods

export const appendToEditing = (
	state: State,
	chunk: string,
	launchIfParsed?: boolean,
) => {
	const result = parse(
		chunk,
		{
			spaceAsSep: state.o.spaceAsSep,
		},
		state.lastParsed,
	);
	state.eMsg = describeResult(result);
	if (state.eMsg) {
		// Not finished.
		console.log("Cont.d", state.eMsg, result);
		pushRawCell(state, `Cont.d: ${state.eMsg}, ${result.left}`);
		state.lastParsed = result.out;
	} else {
		console.log("Finished", convertToExpr(result.out));
		pushRawCell(state, `Finished: ${convertToExpr(result.out)}`);
		state.e[1]({
			out: result.out,
			cursor: [result.left.length],
		});
		state.lastParsed = [[]];
	}
	return result.left;
};

export const executeEditing = (state: State) => {
	pushRawCell(state, "Launch");
};
