// Expr

import { COMMENT_PREFIX, STRING_PREFIX } from "./parser";
import { Tokens } from "./token";

export type Expr =
	| number
	| string // String or comment or id
	| Exprs;
export type Exprs = Expr[];

export enum ExprType {
	Number,
	String,
	Comment,
	Id,
	Exprs,
}

export const exprType = (e: Expr): ExprType => {
	switch (typeof e) {
		case "number":
			return ExprType.Number;
		case "string":
			switch (e.charAt(0)) {
				case COMMENT_PREFIX:
					return ExprType.Comment;
				case STRING_PREFIX:
					return ExprType.String;
				default:
					return ExprType.Id;
			}
	}
	return ExprType.Exprs;
};

// Token to expr parser

export const tokensToExpr = (ts: Tokens): Exprs => {
	const ess: Exprs[] = [[]];
	for (const t of ts) {
		switch (t) {
			case "(":
				ess.push([]);
				break;
			case ")":
				if (ess.length >= 2)
					ess[ess.length - 2].push(ess.pop() as Exprs);
				break;
			default:
				ess[ess.length - 1].push(t);
		}
	}
	while (ess.length > 1) {
		ess[ess.length - 2].push(ess.pop() as Exprs);
	}
	return ess[0];
};

// Expr stringify

export const exprsToString = (es: Exprs, indent?: number): string => {
	if (indent === undefined) indent = 0;
	let s = "",
		sp = false;
	for (const e of es) {
		if (sp) s += " ";
		else sp = true;
		switch (exprType(e)) {
			case ExprType.Exprs:
				s += `(${exprsToString(e as Exprs, indent)})`;
				break;
			case ExprType.Comment:
				s += `# ${(e as string).slice(1)}\n${"  ".repeat(indent)})}`;
				sp = false;
				break;
			case ExprType.String:
				s += `"${(e as string).slice(1)}"`;
				break;
			default:
				s += e.toString();
		}
	}
	return s;
};

// Normalize exprs

export const normalizeExprs = (es: Exprs): Exprs => {
	// Remove unnecessary comments
	const ess: Exprs = [];
	for (let e of es) {
		const t = exprType(e);
		switch (exprType(e)) {
			case ExprType.Comment:
				break;
			case ExprType.Exprs:
				ess.push(normalizeExprs(e as Exprs));
				break;
			case ExprType.Id:
				ess.push((e as string).toLowerCase());
			default:
				ess.push(e);
		}
	}
	return ess;
};
