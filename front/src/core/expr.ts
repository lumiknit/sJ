// Expr

import { Tokens } from "./token";

export const STRING_PREFIX = '"';
export const COMMENT_PREFIX = "#";
export const PUSH_PREFIX = "_";
export const POP_PREFIX = "=_";
export const FUNC_OPEN = "(";
export const FUNC_CLOSE = ")";

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
			}
			return ExprType.Id;
	}
	return ExprType.Exprs;
};

// Token to expr parser

export const tokensToExpr = (ts: Tokens): Exprs => {
	const ess: Exprs[] = [[]];
	for (const t of ts) {
		switch (t) {
			case FUNC_OPEN:
				ess.push([]);
				break;
			case FUNC_CLOSE:
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

// Convert to canonical code
// The code should have same behavior

export const exprsToCanonicalCode = (es: Exprs): string => {
	let s = "";
	let sp = false;
	for (const e of es) {
		const t = exprType(e);
		if (t === ExprType.Exprs)
			(s += `(${exprsToCanonicalCode(e as Exprs)})`), (sp = false);
		else if (t !== ExprType.Comment) {
			if (sp) s += "  ";
			sp = true;
			s +=
				t === ExprType.String
					? JSON.stringify((e as string).slice(1))
					: e.toString();
		}
	}
	return s;
};

// Convert to pretty print

type IndentedLine = [number, string];
type ExprPPOptions = {
	maxWidth?: number;
	tabWidth?: number;
	useTabs?: boolean;
	spaceAsSep?: boolean;
};

type CalculatedExprPPOptions = {
	// Derived from ExprPPOptions
	maxWidth: number;
	tabWidth: number;
	useTabs: boolean;
	spaceAsSep: boolean;
	// Calculated
	tab: string;
	sep: string;
};

const exprsToIndentedLines = (
	opt: CalculatedExprPPOptions,
	es: Exprs,
	level: number,
	firstLineOffset: number,
): IndentedLine[] => {
	const ils: IndentedLine[] = [];
	let s = "";
	let off = firstLineOffset;

	const flushIfNotFit = (c: number) => {
		const sep = (s && opt.sep).length;
		if (off + sep + c > opt.maxWidth) {
			ils.push([level, s]);
			s = "";
			off = level * opt.tabWidth;
		}
	};

	const flushAndPush = (c: string) => {
		flushIfNotFit(c.length);
		const sep = s && opt.sep;
		s += sep + c;
		off += sep.length + c.length;
	};

	const flushWith = (c: string) => {
		flushAndPush(c);
		flushIfNotFit(opt.maxWidth);
	};

	for (const e of es) {
		const t = exprType(e);
		switch (t) {
			case ExprType.Comment:
				flushWith(
					e === "#" ? "" : "# " + (e as string).slice(1).trim(),
				);
				break;
			case ExprType.Exprs:
				{
					const lines = exprsToIndentedLines(
						opt,
						e as Exprs,
						level + 1,
						off + opt.tabWidth,
					);
					if (lines.length === 0) flushAndPush("()");
					else if (lines.length === 1 && lines[0][0] < 0)
						flushAndPush(`(${lines[0][1]})`);
					else {
						flushWith("(");
						for (const [l, s] of lines) {
							ils.push([Math.max(1 + level, l), s]);
						}
						flushAndPush(")");
					}
				}
				break;
			default:
				flushAndPush(
					t === ExprType.String
						? JSON.stringify((e as string).slice(1))
						: e.toString(),
				);
		}
	}
	if (s !== "") ils.push([-1, s]);
	return ils;
};

export const ppExprs = (es: Exprs, opt: ExprPPOptions): string => {
	const copt: CalculatedExprPPOptions = {
		maxWidth: opt.maxWidth || 80,
		tabWidth: opt.tabWidth || 4,
		useTabs: opt.useTabs || false,
		spaceAsSep: opt.spaceAsSep || false,
		tab: "",
		sep: "",
	};
	copt.tab = copt.useTabs ? "\t" : " ".repeat(copt.tabWidth);
	copt.sep = copt.spaceAsSep ? " " : "  ";
	const ils = exprsToIndentedLines(copt, es, 0, 0);
	// Join
	return ils.map(l => copt.tab.repeat(Math.max(0, l[0])) + l[1]).join("\n");
};
