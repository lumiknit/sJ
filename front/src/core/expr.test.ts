import { expect, test } from "vitest";
import * as expr from "./expr";

test("Convert list", () => {
	const doubleConv = (cur: expr.ExprCursor): expr.ExprCursor =>
		expr.curListToCursor(expr.cursorToCurList(cur));
	const tests = [
		[0],
		[1, 1, 3],
		[4, 2, 3, 1],
		[3, 2, 4, 1, 0],
		[1, 1, 2, 3, 5, 8],
	];
	for (const t of tests) {
		expect(doubleConv(t)).toEqual(t);
	}
});

test("Convert list inverse", () => {
	const doubleConv = (cur: expr.ExprCurList): expr.ExprCurList =>
		expr.cursorToCurList(expr.curListToCursor(cur));
	const tests: expr.ExprCurList[] = [0, [[[3, 2], 5], 4]];
	for (const t of tests) {
		expect(doubleConv(t)).toEqual(t);
	}
});

test("Split exprs", () => {
	// [1, 2, 3, 4]
	expect(expr.splitExprs([1, 2, 3, 4], [0])).toEqual([[[]], [[1, 2, 3, 4]]]);
	expect(expr.splitExprs([1, 2, 3, 4], [1])).toEqual([[[1]], [[2, 3, 4]]]);

	// [1, [2, 3], 4, 5]
	expect(expr.splitExprs([1, [2, 3], 4, 5], [1])).toEqual([
		[[1]],
		[[[2, 3], 4, 5]],
	]);
	expect(expr.splitExprs([1, [2, 3], 4, 5], [1, 0])).toEqual([
		[[1], []],
		[
			[4, 5],
			[2, 3],
		],
	]);
	expect(expr.splitExprs([1, [2, 3], 4, 5], [1, 1])).toEqual([
		[[1], [2]],
		[[4, 5], [3]],
	]);
	expect(expr.splitExprs([1, [2, 3], 4, 5], [1, 1, 0])).toEqual([
		[[1], [2]],
		[[4, 5], [3]],
	]);
	expect(expr.splitExprs([1, [2, 3], 4, 5], [1, 2])).toEqual([
		[[1], [2, 3]],
		[[4, 5], []],
	]);
	expect(expr.splitExprs([1, [2, 3], 4, 5], [2])).toEqual([
		[[1, [2, 3]]],
		[[4, 5]],
	]);
});

test("Join exprs", () => {
	expect(expr.joinCuttedExprPair([[[]], [[1, 2, 3, 4]]])).toEqual([
		1, 2, 3, 4,
	]);
	expect(expr.joinCuttedExprPair([[[1]], [[2, 3, 4]]])).toEqual([1, 2, 3, 4]);
	expect(expr.joinCuttedExprPair([[[1]], [[[2, 3], 4, 5]]])).toEqual([
		1,
		[2, 3],
		4,
		5,
	]);
});
