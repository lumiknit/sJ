import { BUILT_IN_MAGICS, BUILT_IN_MODULE } from "./compiler";

export type Index = number;

export type SymEntry = [string, any];

export const BUILT_IN_MAGIC_VALUE = null;

export type VM = {
	// Symbol table
	sym2idx: Map<string, Index>;
	idx2sym: SymEntry[];

	// Compiled code (function)
	fn2idx: Map<string, Index>;
	idx2code: string[];
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
	for (const m of BUILT_IN_MAGICS) {
		for (const prefix of ["", ":", `${BUILT_IN_MODULE}:`]) {
			// Add magic
			vm.sym2idx.set(`${prefix}${m}`, vm.idx2sym.length);
			vm.idx2sym.push([`${prefix}${m}`, BUILT_IN_MAGIC_VALUE]);
		}
	}
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

export type Thread = {
	vm: VM;
	stk: any[];
};

export const newThread = (vm: VM): Thread => ({
	vm,
	stk: [],
});
