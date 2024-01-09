import { TokenZipper, pushToken } from "./token";

export const STRING_PREFIX = '"';
export const COMMENT_PREFIX = "#";

export type ParseOptions = {
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
			case ")":
				return "Too many closings";
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
	// Detect open and its count
	const open = s.s[s.p];
	let openCount = 0;
	while (s.s[p] === open) {
		p++;
		openCount++;
	}
	if (openCount === 2) {
		// Just return empty string
		pushToken(s.z, STRING_PREFIX);
		s.p = p;
		return true;
	}
	// Put string
	let buf = "";
	while (p < s.m) {
		if (s.s[p] === open) {
			// Check closing
			let closeCount = 0;
			while (s.s[p] === open && closeCount < openCount) {
				p++;
				closeCount++;
			}
			if (closeCount >= openCount) {
				pushToken(s.z, STRING_PREFIX + buf);
				s.p = p;
				return true;
			}
			buf += open.repeat(closeCount);
		} else if (s.s[p] === "\\") {
			// Check escape
			const ls: any = { x: 4, u: 6 };
			let l = ls[s.s[p + 1]] || 2;
			const slice = s.s.slice(p, p + l);
			try {
				const parsed = JSON.parse(`"${slice}"`);
				buf += parsed;
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

const parseLiteral = (s: ParseState): boolean => {
	// Extract chars
	const re = /[^()\s#"@:]+/y;
	const modRE = /\s*:\s*/y;
	let buf = "";
	do {
		const m = match(s, re);
		if (m) {
			s.p = re.lastIndex;
			buf += m[0];
		}
		// Check module separator
		const m2 = match(s, modRE);
		if (m2) {
			console.log(m2);
			s.p = modRE.lastIndex;
			buf += ":";
		} else if (!m) {
			break;
		}
		// Check separator
		if (!s.o.spaceAsSep && s.s[s.p] === " ") {
			s.p++;
			buf += " ";
		}
	} while (true);
	// Replace _ and white into a single underbar
	// Strip front/back underbar
	buf = buf.replace(/[_ ]+/g, "_").replace(/^_+|_+$/g, "");
	// Extract the part of number
	const numRE = /^[-+]?[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?/;
	const numMatch = buf.match(numRE);
	if (numMatch) {
		const num = parseFloat(numMatch[0]);
		pushToken(s.z, num);
		buf = buf.slice(numMatch[0].length).replace(/^_+|_+$/g, "");
		if (buf.length === 0) {
			return true;
		}
	}
	// Otherwise, consider as a symbol
	if (buf === "") {
		return false;
	}
	pushToken(s.z, buf);
	return true;
};

const parseOne = (s: ParseState): boolean => {
	skipWhitespaces(s);
	switch (s.s[s.p]) {
		case undefined:
			return true;
		case "#":
			// Skip comment
			const m = match(s, /#(.*)(\n\s*|$)/y);
			if (!m) throw new Error("Unreachable");
			const comment = m[1].trim();
			pushToken(s.z, COMMENT_PREFIX + comment);
			s.p += m[0].length;
			return true;
		case "(":
			s.p++;
			pushToken(s.z, "(");
			return true;
		case ")":
			s.p++;
			pushToken(s.z, ")");
			return true;
		case '"':
		case "'":
			return parseString(s);
		default: {
			// Parse literal or ID
			return parseLiteral(s);
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
