export const typeOf = (value: any): string => {
	if (value instanceof Map) return "map";
	if (value instanceof Array) return "array";
	if (value === null) return "null";
	return typeof value;
};
