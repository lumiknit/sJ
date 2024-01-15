import { Exprs } from "./expr";

export type Index = number;

export type SymEntry = [string, any];

export const BUILT_IN_MAGIC_VALUE = null;

export type VM = {
	// Symbol table
	sym2idx: Map<string, Index>;
	idx2sym: SymEntry[];

	// Compiled code (function)
	fn2idx: Map<string, Index>;
	idx2code: Exprs[];
	idx2impl: ((thread: Thread) => Promise<void>)[];

	global: any;

	trigger: (name: string, value: any) => void;
};

export const newVM = (): VM => {
	const vm: VM = {
		sym2idx: new Map(),
		idx2sym: [],

		fn2idx: new Map(),
		idx2code: [],
		idx2impl: [],

		global: {},

		trigger: () => {},
	};
	return vm;
};

export const addSymbol = (vm: VM, name: string): Index => {
	const idx = vm.idx2sym.length;
	vm.idx2sym.push([
		name,
		async () => {
			throw new Error(`Symbol ${name} is not implemented`);
		},
	]);
	vm.sym2idx.set(name, idx);
	return idx;
};

export const getSymbol = (vm: VM, name: string): [number, any] => {
	const idx = vm.sym2idx.get(name);
	if (idx === undefined) {
		throw new Error(`Symbol ${name} is not found`);
	}
	return [idx, vm.idx2sym[idx][1]];
};

export const allocFn = (vm: VM, exprs: Exprs): Index => {
	const idx = vm.idx2code.length;
	vm.idx2code.push(exprs);
	vm.idx2impl.push(async () => {});
	return idx;
};

export type Thread = {
	vm: VM;
	stk: any[];
};

export const newThread = (vm: VM): Thread => ({
	vm,
	stk: [],
});
