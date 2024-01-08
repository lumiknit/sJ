// Expr

import { COMMENT_PREFIX, STRING_PREFIX } from "./parser";
import { Tokens } from "./token";

export type Expr =
	| number
	| string // String or comment or id
	| Exprs;
export type Exprs = Expr[];

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

export const exprsToString = (es: Exprs, indent?: number): string => {
	if (indent === undefined) indent = 0;
	let s = "";
	let sp = false;
	for (const e of es) {
		if (sp) s += " ";
		else sp = true;
		if (Array.isArray(e)) {
			s += `(${exprsToString(e, indent)})`;
		} else if (typeof e === "string") {
			if (e.startsWith(COMMENT_PREFIX)) {
				s += `# ${e.slice(1)}\n${"  ".repeat(indent)})}`;
				sp = false;
			} else if (e.startsWith(STRING_PREFIX)) {
				s +=
					'"' +
					e.slice(1).replace('"', '\\"').replace("\\", "\\\\") +
					'"';
			} else {
				s += e;
			}
		} else {
			s += e.toString();
		}
	}
	return s;
};
