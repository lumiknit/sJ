import { ExprType, Exprs, exprType } from "./expr";
import {
	BUILT_IN_MAGIC_VALUE,
	Index,
	Thread,
	VM,
	addSymbol,
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

export const BUILT_IN_MAGICS = ["dup", "swap"];
export const BUILT_IN_MODULE = "-";

// Compiler

enum SymType {
	Default, // If function, call, otherwise, push
	Push, // Even if function, push
	Pop, // Pop and set to symbol
}
type SymItem = {
	type: SymType;
	idx: Index;
};

type BuiltIn =
	| number // literal
	| string // literal
	| SymItem; // symbol

type CdGroup = BuiltIn[] | number; // Invoke specific symbol

type Fn = CdGroup[];

const scanExprs = (vm: VM, es: Exprs, isRoot?: boolean): Fn => {
	let fn: Fn = [];
	let cdGroup: CdGroup = [];
	const toScan = [];
	for (const e of es) {
		switch (exprType(e)) {
			case ExprType.Number:
				cdGroup.push(e as number);
				break;
			case ExprType.String:
				cdGroup.push((e as string).slice(1));
				break;
			case ExprType.Id:
				const s = e as string;
				if (s.startsWith("=_")) {
					// This is set operation
					const name = s.slice(2);
					const idx = addSymbol(vm, name);
					cdGroup.push({
						type: SymType.Pop,
						idx,
					});
				} else if (s.startsWith("`")) {
					// This is a push
					const name = s.slice(1);
					const [idx] = getSymbol(vm, name);
					cdGroup.push({
						type: SymType.Push,
						idx,
					});
				} else {
					// This is a call
					const [idx, value] = getSymbol(vm, s);
					if (value === BUILT_IN_MAGIC_VALUE) {
						// built-in, just push
						cdGroup.push({
							type: SymType.Default,
							idx,
						});
					} else {
						// non built-in split cdGroup
						if (cdGroup.length > 0) {
							fn.push(cdGroup);
							cdGroup = [];
						}
						fn.push(idx);
					}
				}
				break;
			case ExprType.Exprs:
				toScan.push(e as Exprs);
				break;
		}
	}
	if (cdGroup.length > 0) {
		fn.push(cdGroup);
	}
	return fn;
};

export const compile = (vm: VM, es: Exprs): number => {
	// Convert to Fns
	const fns: Fn[] = [];
	const fn = scanExprs;
	return 0;
};
