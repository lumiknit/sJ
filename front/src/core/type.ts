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

export type StkVM = {
	vm: VM;
	stk: any[];
};

export const newStkVM = (vm: VM): StkVM => ({
	vm,
	stk: [],
});

// Parse / Compile Results

export type ParsedLiteral = null | boolean | number | string | ParsedLiteral[];
export type ParseOutput = ParsedLiteral[][];

export type Expr = null | boolean | number | string | Expr[];

export const convertToExpr = (out: ParseOutput): Expr | undefined =>
	out.length === 1 ? out[0] : undefined;
