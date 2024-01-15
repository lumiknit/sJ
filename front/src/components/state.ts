import { loadString, saveString } from "@/common/clipboard";
import { VM, newVM, ppExprs, tokensToExpr } from "@/core";
import { COMMENT_PREFIX, describeResult, parse } from "@/core";
import { compile } from "@/core/compiler";
import {
	TokenZipper,
	backspaceTokens,
	extractSelectedTokens,
	joinTokenZipper,
	moveCursorOfTokenZipperInplace,
	splitTokens,
	tokensToString,
} from "@/core/token";
import { isMobile } from "@/mobile-detect";
import { Signal, createSignal, untrack } from "solid-js";

// Helper types

export type Options = {
	spaceAsSep?: boolean;
	sendOnSep?: boolean;
};

export const defaultOptions = (): Options => ({
	spaceAsSep: isMobile ? false : true,
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

	// VM
	vm: VM;

	// Options
	o: Signal<Options>;
};

// Constructor

export const newState = (options: Options): State => {
	return {
		e: createSignal<EditingState>(
			{
				ez: splitTokens([], 0),
			},
			{ equals: false },
		),
		cells: createSignal<Signal<Cell>[]>([]),
		o: createSignal(options),
		vm: newVM(),
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

const pushCell = (state: State, type: string, data: any): number => {
	state.cells[1](cs => [...cs, createSignal({ type, data })]);
	scrollToBottom(state);
	return state.cells[0]().length - 1;
};

// Methods

export const toggleSpaceAsSep = (state: State): boolean | undefined => {
	state.o[1](o => ({
		...o,
		spaceAsSep: !o.spaceAsSep,
	}));
	return untrack(state.o[0]).spaceAsSep;
};

const keepMark = (tz: TokenZipper, flag?: boolean) => {
	if (flag && tz[2] === undefined) {
		tz[2] = tz[0].length;
	} else if (flag === false) {
		tz[2] = undefined;
	}
};

export const moveCursorOffset = (
	state: State,
	delta: number,
	keepMarkFlag?: boolean,
) => {
	state.e[1](es => {
		keepMark(es.ez, keepMarkFlag);
		moveCursorOfTokenZipperInplace(es.ez, es.ez[0].length + delta);
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
	state.e[1](es => {
		const p = Math.min(Math.max(pos, 0), es.ez[0].length + es.ez[1].length);
		keepMark(es.ez, keepMarkFlag);
		// If same position is specified, turn off mark.
		if (!keepMarkFlag && p === es.ez[0].length) {
			es.ez[2] = undefined;
		}
		moveCursorOfTokenZipperInplace(es.ez, p);
		return es;
	});
	focusMainInput(state);
};

export const backspaceToken = (state: State): boolean => {
	state.e[1](es => ({
		...es,
		ez: backspaceTokens(es.ez),
	}));
	return true;
};

export const appendToEditing = (
	state: State,
	chunk: string,
	launchIfParsed?: boolean,
): string => {
	let r = chunk;
	state.e[1](es => {
		if (es.ez[2] !== undefined) {
			es.ez = backspaceTokens(es.ez);
		}
		const result = parse(es.ez, chunk, {
			partial: true,
			spaceAsSep: state.o[0]().spaceAsSep,
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
	pushCell(
		state,
		"codeInput",
		ppExprs(exprs, {
			spaceAsSep: state.o[0]().spaceAsSep,
		}),
	);
	compile(state.vm, exprs);
	// Clear editing
	state.e[1](es => {
		es.ez = splitTokens([], 0);
		return es;
	});
};

export const commitEditing = (state: State) => {
	const z = state.e[0]().ez;
	if (z[1].length === 0 && z[2] === undefined) {
		const l = z[0];
		const lt = l[l.length - 1];
		if (lt === COMMENT_PREFIX) {
			l.pop();
			executeEditing(state);
		} else {
			appendToEditing(state, `${COMMENT_PREFIX}\n`);
		}
	}
};

export const copySelectedEditing = (state: State): boolean => {
	const tokens = extractSelectedTokens(state.e[0]().ez);
	if (tokens.length === 0) return false;
	const s = tokensToString(tokens);
	saveString(s);
	return true;
};

export const cutSelectedEditing = (state: State): boolean =>
	copySelectedEditing(state) && backspaceToken(state);

export const pasteEditing = async (
	state: State,
): Promise<boolean | undefined> => {
	const s = await loadString();
	if (s) {
		appendToEditing(state, s);
		return true;
	}
};
