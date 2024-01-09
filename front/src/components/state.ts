import { exprsToString, tokensToExpr } from "@/core";
import { describeResult, parse } from "@/core/parser";
import {
	TokenZipper,
	deleteTokens,
	emptyTokenZipper,
	joinTokenZipper,
	moveTokenZipperInplace,
} from "@/core/token";
import { Signal, createSignal } from "solid-js";

// Helper types

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

// Main type

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

const keepMark = (tz: TokenZipper, flag?: boolean) => {
	if (flag && tz[2] === undefined) {
		tz[2] = tz[0].length;
	} else if (flag === false) {
		tz[2] = undefined;
	}
};

export const moveCursorLeft = (state: State, keepMarkFlag?: boolean) => {
	state.e[1](es => {
		keepMark(es.ez, keepMarkFlag);
		moveTokenZipperInplace(es.ez, es.ez[0].length - 1);
		console.log(es.ez);
		return es;
	});
	focusMainInput(state);
};

export const moveCursorRight = (state: State, keepMarkFlag?: boolean) => {
	state.e[1](es => {
		keepMark(es.ez, keepMarkFlag);
		moveTokenZipperInplace(es.ez, es.ez[0].length + 1);
		console.log(es.ez);
		return es;
	});
	focusMainInput(state);
};

export const moveCursorAt = (
	state: State,
	pos: number,
	keepMarkFlag?: boolean,
) => {
	console.log(keepMarkFlag);
	state.e[1](es => {
		keepMark(es.ez, keepMarkFlag);
		console.log(es.ez);
		// If same position is specified, turn off mark.
		if (!keepMarkFlag && pos === es.ez[0].length) {
			es.ez[2] = undefined;
			console.log("Disable", es.ez);
		}
		moveTokenZipperInplace(es.ez, pos);
		console.log(es.ez);
		return es;
	});
	focusMainInput(state);
};

export const backspaceToken = (state: State) => {
	state.e[1](es => {
		const z = deleteTokens(es.ez);
		return {
			...es,
			ez: z,
		};
	});
};

export const appendToEditing = (
	state: State,
	chunk: string,
	launchIfParsed?: boolean,
): string => {
	let r = chunk;
	state.e[1](es => {
		if (es.ez[2] !== undefined) {
			es.ez = deleteTokens(es.ez);
		}
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
	// Extract tokens
	const tokens = joinTokenZipper(state.e[0]().ez);
	// Convert into expr
	const exprs = tokensToExpr(tokens);
	pushRawCell(state, "Launch:\n" + exprsToString(exprs));
	// Clear editing
	state.e[1](es => {
		es.ez = emptyTokenZipper();
		return es;
	});
};
