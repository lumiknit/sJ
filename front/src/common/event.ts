// Click events

const LONG_CLICK_TIME = 500;

type ClickEvents = {
	click?: () => void;
	longClick?: () => void;
};
export const addClickEvents = (el: HTMLElement, events: ClickEvents) => {
	// Handle by touch event
	let pressTO: number | null = null;
	el.addEventListener("pointerdown", e => {
		if (pressTO !== null) {
			clearTimeout(pressTO);
		}
		pressTO = setTimeout(() => {
			events.longClick?.();
			pressTO = null;
		}, LONG_CLICK_TIME);
	});
	el.addEventListener("pointerup", e => {
		if (pressTO !== null) {
			clearTimeout(pressTO);
			pressTO = null;
			events.click?.();
		}
	});
};
