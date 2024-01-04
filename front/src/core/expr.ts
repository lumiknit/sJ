// Expr

export type Expr =
	| null
	| boolean
	| number
	| string // String or comment or id
	| Exprs;
export type Exprs = Expr[];


// Cutted Expr (editing state)

export type ExprCursor = number[];
export type ExprCurList = number | [ExprCurList, number];

// Cursor Helpers

export const cursorToCurList = (cursor: ExprCursor): ExprCurList => {
	const l = cursor.length;
	if(l === 0) return 0;
	let c: ExprCurList = cursor[0];
	for(let i = 1; i < l; i++) {
		c = [c, cursor[i]];
	}
	return c;
};

export const curListToCursor = (curList: ExprCurList): ExprCursor => {
	const cursor: ExprCursor = [];
	let c: ExprCurList = curList;
	while(Array.isArray(c)) {
		cursor.push(c[1]);
		c = c[0];
	}
	cursor.push(c);
	return cursor.reverse();
};

// Cutted Exprs

export type CuttedExprs = Expr[][];
export type CuttedExprsPair = [CuttedExprs, CuttedExprs];

// Methods

export const emptyExprs = (): Exprs => [];

export const splitExprs = (exprs: Exprs, cursor: ExprCursor): CuttedExprsPair => {
	const l = [];
	const r = [];
	let e: Exprs = exprs;
	for(let i = 0; i < cursor.length; i++) {
		const p = cursor[i];
		const ep = e[p];
		if(i < cursor.length - 1 && Array.isArray(ep)) {
			l.push(e.slice(0, p));
			r.push(e.slice(p + 1));
			e = ep;
		} else {
			l.push(e.slice(0, p));
			r.push(e.slice(p));
			break;
		}
	}
	return [l, r];
};

export const joinCuttedExprPair = (c: CuttedExprsPair): Exprs => {
	const [l, r] = c;
	let lp = l.length - 1;
	let e: Exprs = lp > 0 ? l[lp] : [];
	// Merge right side with exprs, and merge left side with exprs
	for(let i = r.length - 1; i >= 0; i--) {
		e = [...e, ...r[i]];
		if(lp > 0) {
			lp--;
			e = [...l[lp], e];
		}
	}
	// If some left side remains, merge it with exprs
	while(lp > 0) {
		lp--;
		e = [...l[lp], e];
	}
	return e;
};
