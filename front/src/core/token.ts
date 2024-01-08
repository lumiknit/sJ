// Expr

import { COMMENT_PREFIX, STRING_PREFIX } from "./parser";

export type Token = number | string; // String or comment or id
export type Tokens = Token[];

// Token Zipper

export type TokenZipper = [Tokens, Tokens, number?];

export const emptyTokens = (): Tokens => [];
export const emptyTokenZipper = (): TokenZipper => [[], []];

export const splitTokens = (tokens: Tokens, cursor: number): TokenZipper => {
	return [tokens.slice(0, cursor), tokens.slice(cursor).reverse()];
};

export const joinTokenZipper = (z: TokenZipper): Tokens => {
	return [...z[0], ...z[1].reverse()];
};

export const moveTokenZipperInplace = (
	z: TokenZipper,
	pos: number,
): TokenZipper => {
	const [l, r, c] = z;
	if (pos > l.length) {
		pos -= l.length;
		if (pos >= r.length) {
			pos = r.length;
		}
		const n = r.length - pos;
		l.push(...r.slice(n).reverse());
		r.splice(n);
	} else if (pos < l.length) {
		if (pos < 0) {
			pos = 0;
		}
		r.push(...l.slice(pos).reverse());
		l.splice(pos);
	}
	return [l, r, c];
};

export const pushToken = (zipper: TokenZipper, token: Token) => {
	if (zipper[2] !== undefined && zipper[2] >= zipper[0].length) {
		zipper[0].length++;
	}
	zipper[0].push(token);
};

export const deleteTokens = (zipper: TokenZipper): TokenZipper => {
	const [l, r, c] = zipper;
	if (c === undefined) {
		l.pop();
	} else if (c < l.length) {
		l.splice(c);
	} else if (c > l.length) {
		r.splice(r.length - (c - l.length));
	}
	return [l, r, undefined];
};