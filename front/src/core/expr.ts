// Expr

import { COMMENT_PREFIX, STRING_PREFIX } from "./parser";

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
	if (l === 0) return 0;
	let c: ExprCurList = cursor[0];
	for (let i = 1; i < l; i++) {
		c = [c, cursor[i]];
	}
	return c;
};

export const curListToCursor = (curList: ExprCurList): ExprCursor => {
	const cursor: ExprCursor = [];
	let c: ExprCurList = curList;
	while (Array.isArray(c)) {
		cursor.push(c[1]);
		c = c[0];
	}
	cursor.push(c);
	return cursor.reverse();
};

// Cutted Exprs

export type CuttedExprs = Expr[][];
export type CuttedExprsPair = [CuttedExprs, CuttedExprs, ExprCursor];

// Methods

export const emptyExprs = (): Exprs => [];
export const emptyCuttedExprsPair = (): CuttedExprsPair => [[], [], [0]];

export const splitExprs = (
	exprs: Exprs,
	cursor: ExprCursor,
): CuttedExprsPair => {
	const l = [],
		r = [];
	let e: Exprs = exprs;
	for (let i = 0; i < cursor.length; i++) {
		const p = cursor[i];
		const ep = e[p];
		if (i < cursor.length - 1 && Array.isArray(ep)) {
			l.push(e.slice(0, p));
			r.push(e.slice(p + 1));
			e = ep;
		} else {
			l.push(e.slice(0, p));
			r.push(e.slice(p));
			break;
		}
	}
	return [l, r, cursor.slice(l.length)];
};

export const joinCuttedExprPair = (c: CuttedExprsPair): Exprs => {
	const [l, r] = c;
	let lp = l.length - 1;
	let e: Exprs = lp > 0 ? l[lp] : [];
	// Merge right side with exprs, and merge left side with exprs
	for (let i = r.length - 1; i >= 0; i--) {
		e = [...e, ...r[i]];
		if (lp > 0) {
			lp--;
			e = [...l[lp], e];
		}
	}
	// If some left side remains, merge it with exprs
	while (lp > 0) {
		lp--;
		e = [...l[lp], e];
	}
	return e;
};

export const pushExprToCuttedExprs = (c: CuttedExprsPair, item: Expr) => {
	const [l, , cur] = c;
	const lp = l.length - 1;
	if (lp < 0) return;
	l[lp].push(item);
	cur[cur.length - 1]++;
};

export const openCuttedExprs = (c: CuttedExprsPair) => {
	c[0].push([]);
	c[2].push(0);
};

export const closeCuttedExprs = (c: CuttedExprsPair): boolean => {
	const [l, , cur] = c;
	const lp = l.length - 1,
		cond = lp > 0;
	if (cond) {
		l[lp - 1].push(l.pop()!);
		cur.pop();
		cur[cur.length - 1]++;
	}
	return cond;
};

export const rightCursorToCursor = (
	c: CuttedExprsPair,
	depth: number,
	offset: number,
): ExprCursor => {
	const [l, r, cur] = c;
	if (offset > r.length) offset = r.length;
	let leftDepth = cur.length - r.length + depth,
		rightIndex = l[leftDepth].length + offset;
	if (leftDepth < 0) leftDepth = 0;
	let a = cur.slice(0, leftDepth);
	a.push(rightIndex);
	return a;
};

export const exprToString = (e: Expr): string => {
	switch (typeof e) {
		case "boolean":
			return e ? "true" : "false";
		case "number":
			return e.toString();
		case "string":
			if (e[0] === COMMENT_PREFIX) {
				if (e.length === 1) return "\n";
				return `#${e.slice(1)}\n`;
			} else if (e[0] === STRING_PREFIX) {
				return `"${e.slice(1)}"`;
			} else {
				return e;
			}
	}
	if (e === null) return "null";
	else {
		return "(" + e.map(exprToString).join(" ") + ")";
	}
};
