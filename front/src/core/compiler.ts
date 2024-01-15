import { ExprType, Exprs, PUSH_PREFIX, POP_PREFIX, exprType } from "./expr";
import {
	BUILT_IN_MAGIC_VALUE,
	Index,
	Thread,
	VM,
	addSymbol,
	allocFn,
	getSymbol,
} from "./type";

const THREAD_VAR_NAME = "t";

const asyncFuncConstructor = Object.getPrototypeOf(async () => {}).constructor;

const makeAsyncFunc = (code: string): ((t: Thread) => Promise<void>) => {
	return new asyncFuncConstructor(THREAD_VAR_NAME, code) as (
		t: Thread,
	) => Promise<void>;
};

// Built-in magics

export const BUILT_IN_MAGICS = [
	"dup",
	"swap",
	"print",
	"+",
	"-",
	"*",
	"=",
	"!=",
	"<",
	">",
	"&",
	"|",
	",",
	"[",
	"]",
	"sep",
];

export const BUILT_IN_ARG_MAGICS = [".", ".."];

export const BUILT_IN_MAGICS_SET = new Set(BUILT_IN_MAGICS);
export const BUILT_IN_ARG_MAGICS_SET = new Set(BUILT_IN_ARG_MAGICS);

const extractArgFromMagic = (s: string): [string, number] => {
	let p = s.length;
	let arg = 0,
		d = 1;
	const zero = "0".charCodeAt(0),
		nine = "9".charCodeAt(0);
	while (p > 0) {
		const c = s[p - 1].charCodeAt(0);
		if (c < zero || c > nine) break;
		arg += d * (c - zero);
		d *= 10;
		p--;
	}
	return [s.slice(0, p), arg];
};

// Compiler

enum SymType {
	Default, // If function, call, otherwise, push
	Push, // Even if function, push
	Pop, // Pop and set to symbol
	Fn, // Function
}

type SymItem = {
	type: SymType;
	idx: Index;
	name: string;
	arg?: number;
};

type Op =
	| number // literal
	| string // literal
	| SymItem; // symbol

type OpGroup =
	| Op[] // List of built-ins
	| number; // Or name of function

type Fn = {
	idx: Index;
	gs: OpGroup[];
};

type ScanResult = {
	f: Fn[];
	newSymbols: string[];
};

const findNewSymbols = (vm: VM, es: Exprs): string[] => {
	const res: string[] = [];
	for (const e of es) {
		if (exprType(e) === ExprType.Id) {
			const s = e as string;
			if (s.startsWith(POP_PREFIX)) {
				const name = s.slice(POP_PREFIX.length).toLowerCase();
				addSymbol(vm, name);
				res.push(name);
			}
		}
	}
	return res;
};

const scanExprs = (
	res: ScanResult,
	vm: VM,
	es: Exprs,
	isRoot?: boolean,
): Fn => {
	const fn: Fn = {
		idx: allocFn(vm, es),
		gs: [],
	};
	let opGroup: OpGroup = [];
	for (const e of es) {
		switch (exprType(e)) {
			case ExprType.Number:
				opGroup.push(e as number);
				break;
			case ExprType.String:
				opGroup.push((e as string).slice(1));
				break;
			case ExprType.Id:
				const s = e as string;
				if (s.startsWith(POP_PREFIX)) {
					if (!isRoot) {
						throw new Error("Cannot pop in non-root");
					}
					// This is set operation
					const name = s.slice(POP_PREFIX.length).toLowerCase();
					opGroup.push({
						type: SymType.Pop,
						idx: getSymbol(vm, name)[0],
						name,
					});
				} else if (s.startsWith(PUSH_PREFIX)) {
					const name = s.slice(PUSH_PREFIX.length).toLowerCase();
					// This is a push
					opGroup.push({
						type: SymType.Push,
						idx: getSymbol(vm, name)[0],
						name,
					});
				} else {
					// This is a call
					let name = s.toLowerCase();
					try {
						const [idx, value] = getSymbol(vm, name);
						if (value !== BUILT_IN_MAGIC_VALUE) {
							// non built-in split cdGroup
							if (opGroup.length > 0) {
								fn.gs.push(opGroup);
								opGroup = [];
							}
							fn.gs.push(idx);
							break;
						}
					} catch {
						// Not found
					}
					// Check if this is correct built-in
					if (name.startsWith(":")) {
						name = name.slice(1);
					}
					const [name2, arg] = extractArgFromMagic(name);
					if (
						BUILT_IN_MAGICS_SET.has(name) ||
						BUILT_IN_ARG_MAGICS_SET.has(name2)
					) {
						opGroup.push({
							type: SymType.Default,
							idx: -1,
							name: name2,
							arg,
						});
						break;
					}
				}
				break;
			case ExprType.Exprs:
				{
					const ef = scanExprs(res, vm, e as Exprs);
					opGroup.push({
						type: SymType.Fn,
						idx: ef.idx,
						name: "",
					});
				}
				break;
		}
	}
	if (opGroup.length > 0) {
		fn.gs.push(opGroup);
	}
	res.f.push(fn);
	return fn;
};

// Convert to JS

type JSCode = string;
type JSConvEntry = string;
type JSConvState = {
	sp: number;
	minSp: number;
	maxSp: number;
	varCnt: number;
	stack: JSConvEntry[];
};

const newJSVar = (state: JSConvState): string => {
	// Convert to base 36
	let name = state.varCnt.toString(36);
	state.varCnt++;
	return "_" + name;
};

const offJSStack = (state: JSConvState, off: number): number => {
	const idx = state.sp + off;
	state.maxSp = Math.max(state.maxSp, idx);
	state.minSp = Math.min(state.minSp, idx);
	return idx;
};

const moveJSSp = (state: JSConvState, off: number) => {
	const idx = offJSStack(state, off);
	state.sp = idx;
};

const getJSVarAt = (state: JSConvState, off: number): string => {
	const idx = offJSStack(state, off);
	if (state.stack[idx] === undefined) {
		state.stack[idx] = newJSVar(state);
	}
	return state.stack[idx];
};

const pushJSValue = (state: JSConvState, expr: JSCode): JSCode => {
	const varName = getJSVarAt(state, 1);
	state.sp++;
	return `${varName} = ${expr};`;
};

const pushJSLiteralCode = (
	state: JSConvState,
	value: number | string,
): JSCode => {
	// Check if the variable exists
	return pushJSValue(state, JSON.stringify(value));
};

const fnToJS = (vm: VM, fn: Fn): ((t: Thread) => Promise<void>) => {
	const s: JSConvState = {
		sp: 0,
		minSp: 0,
		maxSp: 0,
		varCnt: 0,
		stack: [],
	};
	const js: JSCode[] = [];
	for (const gs of fn.gs) {
		if (typeof gs === "number") {
			// In this case, call function if it's function
			const setter = `const _f = ${THREAD_VAR_NAME}.vm.idx2impl[${gs}];`;
			const cond = `if(typeof _f === "function")`;
			const thenClause = `await _f(${THREAD_VAR_NAME});`;
			const elseClause = `${THREAD_VAR_NAME}.stk.push(_f);`;
			js.push(`${setter}${cond}{${thenClause}}else{${elseClause}}`);
			continue;
		}
		// Otherwise convert instructions
		const block: JSCode[] = [];
		for (const g of gs) {
			switch (typeof g) {
				case "number":
				case "string":
					block.push(pushJSLiteralCode(s, g));
					break;
				default:
					const sym = g as SymItem;
					switch (sym.type) {
						case SymType.Default:
							// Built-in call
							s.stack.push(sym.name);
							break;
						case SymType.Push:
							block.push(
								pushJSValue(
									s,
									`${THREAD_VAR_NAME}.vm.idx2sym[${sym.idx}]`,
								),
							);
							break;
						case SymType.Pop:
							s.stack.push(sym.name);
							break;
						case SymType.Fn:
							block.push(
								pushJSValue(
									s,
									`${THREAD_VAR_NAME}.vm.idx2sym[${sym.idx}]`,
								),
							);
							break;
					}
					break;
			}
		}
		js.push(`{${block.join("\n")}}`);
	}
};

export const compile = (vm: VM, es: Exprs): number => {
	const newSymbols = findNewSymbols(vm, es);
	// Convert to Fns
	const scanResult: ScanResult = {
		f: [],
		newSymbols,
	};
	const mainFn = scanExprs(scanResult, vm, es, true);
	console.log(mainFn, scanResult);
	return 0;
};
