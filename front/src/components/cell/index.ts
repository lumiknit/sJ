import { Component } from "solid-js";
import RawCell from "./RawCell";

export { default as RawCell } from "./RawCell";

export const CELL_TYPE_TO_COMPONENT = new Map<string, Component<any>>([
	["raw", RawCell],
]);
