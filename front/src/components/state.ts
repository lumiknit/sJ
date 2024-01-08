import { describeResult, parse } from "@/core/parser";
import {
	TokenZipper,
	deleteTokens,
	emptyTokenZipper,
	moveTokenZipperInplace,
} from "@/core/token";
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
	ez: TokenZipper;
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
	eMsg?: string;
	miRef?: HTMLTextAreaElement;

	// Cells
	cells: Signal<Signal<Cell>[]>;

	// Options
	o: Options;
};

// Constructor

export const newState = (options: Options): State => {
	return {
		e: createSignal<EditingState>(
			{
				ez: emptyTokenZipper(),
			},
			{ equals: false },
		),
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

const focusMainInput = (state: State) => {
	state.miRef?.focus();
};

const pushRawCell = (state: State, data: string) => {
	state.cells[1](cs => [...cs, createSignal({ type: "raw", data })]);
	scrollToBottom(state);
};

// Methods

export const moveCursorLeft = (state: State) => {
	state.e[1](es => {
		moveTokenZipperInplace(es.ez, es.ez[0].length - 1);
		return es;
	});
	focusMainInput(state);
};

export const moveCursorRight = (state: State) => {
	state.e[1](es => {
		moveTokenZipperInplace(es.ez, es.ez[0].length + 1);
		return es;
	});
	focusMainInput(state);
};

export const moveCursorAt = (state: State, pos: number) => {
	state.e[1](es => {
		moveTokenZipperInplace(es.ez, pos);
		return es;
	});
	focusMainInput(state);
};

export const backspaceToken = (state: State) => {
	state.e[1](es => {
		deleteTokens(es.ez);
		return es;
	});
};

export const appendToEditing = (
	state: State,
	chunk: string,
	launchIfParsed?: boolean,
): string => {
	let r = chunk;
	state.e[1](es => {
		const result = parse(es.ez, chunk, {
			spaceAsSep: state.o.spaceAsSep,
		});
		state.eMsg = describeResult(result);
		if (state.eMsg) {
			// Not finished.
			console.log("Cont.d", state.eMsg, result);
		} else {
			console.log("Finished", result, es.ez);
		}
		r = r.slice(result.p);
		return es;
	});
	scrollToBottom(state);
	return r;
};

export const executeEditing = (state: State) => {
	pushRawCell(state, "Launch");
};
