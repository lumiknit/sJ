// Expr

import { COMMENT_PREFIX, STRING_PREFIX } from "./expr";

export type Token = number | string; // String or comment or id
export type Tokens = Token[];

// Token Zipper

export type TokenZipper = [Tokens, Tokens, number?];

export const splitTokens = (tokens: Tokens, cursor: number): TokenZipper => [
	tokens.slice(0, cursor),
	tokens.slice(cursor).reverse(),
];

export const joinTokenZipper = (z: TokenZipper): Tokens => [
	...z[0],
	...z[1].reverse(),
];

export const moveCursorOfTokenZipperInplace = (
	z: TokenZipper,
	pos: number,
): TokenZipper => {
	const [l, r, c] = z;
	pos = Math.min(Math.max(pos, 0), l.length + r.length);
	if (pos > l.length)
		l.push(...r.splice(r.length - (pos - l.length)).reverse());
	else if (pos < l.length) r.push(...l.splice(pos).reverse());
	return [l, r, c];
};

export const pushToken = (zipper: TokenZipper, token: Token) => {
	if (zipper[2]! >= zipper[0].length) zipper[0].length++;
	zipper[0].push(token);
};

export const backspaceTokens = (zipper: TokenZipper): TokenZipper => {
	const [l, r, c] = zipper;
	if (c! < l.length) {
		l.splice(c!);
	} else if (c! > l.length) {
		r.splice(r.length - (c! - l.length));
	} else {
		l.pop();
	}
	return [l, r];
};

export const extractSelectedTokens = (zipper: TokenZipper): Tokens => {
	const [l, r, c] = zipper;
	if (c === undefined) {
		return [];
	} else if (c < l.length) {
		return l.slice(c);
	} else if (c > l.length) {
		return r.slice(r.length - (c - l.length)).reverse();
	}
	return [];
};

export const tokensToString = (tokens: Tokens): string => {
	let s = "";
	for (const t of tokens) {
		if (typeof t === "string") {
			if (t.startsWith(COMMENT_PREFIX)) {
				s += t + "\n";
			} else if (t.startsWith(STRING_PREFIX)) {
				s += JSON.stringify(t.slice(1));
			} else {
				if (s.length > 0) s += "  ";
				s += t;
			}
		} else {
			if (s.length > 0) s += "  ";
			s += t.toString();
		}
	}
	return s;
};
