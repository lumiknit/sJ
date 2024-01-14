import { TokenZipper, pushToken } from "./token";
import { COMMENT_PREFIX, STRING_PREFIX } from "./expr";

export type ParseOptions = {
	partial?: boolean;
	spaceAsSep?: boolean;
};

export type ParseResult = {
	p: number;
	left: string;
};

export const describeResult = (result: ParseResult): string | undefined => {
	if (result.left.length > 0) {
		switch (result.left[0]) {
			case '"':
			case "'":
				return "Unclosed string";
		}
		return "Unknown error with `" + result.left[0] + "`";
	}
	// OK
	return undefined;
};

type ParseState = {
	z: TokenZipper; // Destination
	s: string; // Source String
	p: number; // Current position
	m: number; // Max position = Length
	o: ParseOptions;
};

const match = (s: ParseState, re: RegExp) => {
	re.lastIndex = s.p;
	return re.exec(s.s);
};

const skipWhitespaces = (s: ParseState): void => {
	const m = match(s, /\s+/y);
	if (m) {
		// Check newline is included
		if (m[0].indexOf("\n") >= 0) {
			pushToken(s.z, COMMENT_PREFIX);
		}
		s.p += m[0].length;
	}
};

const parseString = (s: ParseState): boolean => {
	let p = s.p;
	const countSameChars = (max: number): number => {
		const c = s.s[p];
		let count = 0;
		while (s.s[p] === c && count < max) {
			p++;
			count++;
		}
		return count;
	};
	// Detect open and its count
	const open = s.s[s.p];
	let openCount = countSameChars(99);
	if (openCount === 2) (openCount = 1), p--;
	// Put string
	let buf = "";
	while (p < s.m) {
		if (s.s[p] === open) {
			// Check closing
			const closeCount = countSameChars(openCount);
			if (closeCount >= openCount) {
				pushToken(s.z, STRING_PREFIX + buf);
				s.p = p;
				return true;
			}
			buf += open.repeat(closeCount);
		} else if (s.s[p] === "\\") {
			// Check escape
			const l = { x: 4, u: 6 }[s.s[p + 1]] || 2;
			const slice = s.s.slice(p, p + l);
			try {
				buf += JSON.parse(`"${slice}"`);
			} catch {
				buf += slice;
			}
			p += l;
		} else {
			// Otherwise, just append
			buf += s.s[p];
			p++;
		}
	}
	return false;
};

const parseNumber = (s: ParseState): boolean => {
	const re = /^[-+]?[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?/;
	const m = match(s, re);
	if (!m) return false;
	pushToken(s.z, parseFloat(m[0]));
	s.p += m[0].length;
	return true;
};

const parseLiteral = (s: ParseState): boolean => {
	// Extract chars
	const re = /(\s*:\s*)?([^()\s#"@:]+)/y;
	let buf = "";
	for (;;) {
		const m = match(s, re);
		if (m) {
			s.p = re.lastIndex;
			buf += (m[1] ?? "") + m[2];
		} else break;
		// Check separator
		if (!s.o.spaceAsSep && s.s[s.p] === " ") {
			s.p++;
			buf += " ";
		}
	}
	// Replace _ and white into a single underbar
	// Strip front/back underbar
	buf = buf.replace(/[_ ]+/g, "_").replace(/_+$/g, "");
	if (buf === "") {
		return false;
	}
	pushToken(s.z, buf);
	return true;
};

// parse one token
const parseOne = (s: ParseState): boolean => {
	skipWhitespaces(s);
	switch (s.s[s.p]) {
		case undefined:
			return true;
		case "#":
			// Skip comment
			const re = s.o.partial ? /#(.*)\n\s*/y : /#(.*)(\n\s*|$)/y;
			const m = match(s, re);
			if (!m) return false;
			pushToken(s.z, COMMENT_PREFIX + m[1].trim());
			s.p += m[0].length;
			return true;
		case "(":
		case ")":
			pushToken(s.z, s.s[s.p]);
			s.p++;
			return true;
		case '"':
		case "'":
			return parseString(s);
		default: {
			// Parse literal or ID
			return parseNumber(s) || parseLiteral(s);
		}
	}
};

export const parse = (
	dst: TokenZipper,
	input: string,
	options: ParseOptions,
): ParseResult => {
	const s: ParseState = {
		z: dst,
		s: input,
		p: 0,
		m: input.length,
		o: options,
	};
	while (s.p < s.m && parseOne(s));
	return {
		p: s.p,
		left: s.s.slice(s.p),
	};
};
