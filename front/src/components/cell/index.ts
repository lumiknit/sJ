import { Component } from "solid-js";
import RawCell from "./RawCell";
import CodeInputCell from "./CodeInputCell";

export { default as EditingCell } from "./EditingCell";
export { default as RawCell } from "./RawCell";

export const CELL_TYPE_TO_COMPONENT = new Map<string, Component<any>>([
	["raw", RawCell],
	["codeInput", CodeInputCell],
]);
