import { ParseOutput, ParsedLiteral } from "./type";

export const STRING_PREFIX = '"';
export const COMMENT_PREFIX = "#";

export type ParseOptions = {
	spaceAsSep?: boolean;
};

export type ParseResult = {
	p: number;
	left: string;
	out: ParsedLiteral[][];
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
	if (result.out.length > 1) {
		return "Unclosed";
	}
	// OK
	return undefined;
};

type ParseState = {
	s: string;
	p: number;
	m: number;
	l: string[];
	o: ParseOptions;
	out: ParseOutput;
};

const match = (s: ParseState, re: RegExp) => {
	re.lastIndex = s.p;
	return re.exec(s.s);
};

const push = (s: ParseState, v: ParsedLiteral) => {
	s.out[s.out.length - 1].push(v);
};

const skipWhitespaces = (s: ParseState): void => {
	const m = match(s, /\s+/y);
	if (m) {
		// Check newline is included
		if (m[0].indexOf("\n") >= 0) {
			push(s, COMMENT_PREFIX);
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
				push(s, STRING_PREFIX + buf);
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
	const re = /[^()\s#"@]+/y;
	let buf = "";
	do {
		const m = match(s, re);
		if (!m) break;
		s.p = re.lastIndex;
		buf += m[0];
		console.log(s.s[s.p], !s.o.spaceAsSep, s.s[s.p] === " ");
		if (!s.o.spaceAsSep && s.s[s.p] === " ") {
			s.p++;
			buf += " ";
		}
	} while (true);
	// Replace _ and white into a single underbar
	buf = buf.replace(/[_ ]+/g, "_");
	// Strip front/back underbar
	buf = buf.replace(/^_+|_+$/g, "");
	// Check if it is a number
	const num = parseFloat(buf);
	if (!isNaN(num)) {
		push(s, num);
		return true;
	}
	// Otherwise, consider as a symbol
	if (buf === "") {
		return false;
	}
	push(s, buf);
	return true;
};

const parseOne = (s: ParseState): boolean => {
	skipWhitespaces(s);
	switch (s.s[s.p]) {
		case undefined:
			return true;
		case "#":
			// Skip comment
			const m = match(s, /#(.+)(\n\s*|$)/y);
			if (!m) throw new Error("Unreachable");
			const comment = m[1].trim();
			if (comment) {
				push(s, COMMENT_PREFIX + comment);
			}
			s.p += m[0].length;
			return true;
		case "(":
			s.p++;
			s.out.push([]);
			return true;
		case ")":
			s.p++;
			if (s.out.length <= 1) {
				return false;
			}
			const out = s.out.pop();
			push(s, out!);
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
	input: string,
	options: ParseOptions,
	lastOutput?: ParseOutput,
): ParseResult => {
	const s: ParseState = {
		s: input,
		p: 0,
		m: input.length,
		l: [],
		o: options,
		out: lastOutput ?? [[]],
	};
	while (s.p < s.m && parseOne(s));
	return {
		p: s.p,
		left: s.s.slice(s.p),
		out: s.out,
	};
};