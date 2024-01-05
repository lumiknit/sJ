export type VM = {
	// Symbol table
	sym2idx: Map<string, number>;
	idx2sym: string[];

	// Compiled code
	fn2idx: Map<string, number>;
	idx2code: string[];

	global: any;

	trigger: (name: string, value: any) => void;
};

export const newVM = (): VM => ({
	sym2idx: new Map(),
	idx2sym: [],

	fn2idx: new Map(),
	idx2code: [],

	global: {},

	trigger: () => {},
});

export type Thread = {
	vm: VM;
	stk: any[];
};

export const newThread = (vm: VM): Thread => ({
	vm,
	stk: [],
});
