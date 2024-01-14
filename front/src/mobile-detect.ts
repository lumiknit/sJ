const mobileRegex = [
	/Android/i,
	/iPhone/i,
	/iPad/i,
	/iPod/i,
	/BlackBerry/i,
	/Windows Phone/i,
];

export const isMobile = mobileRegex.some(mobile =>
	window.navigator.userAgent.match(mobile),
);
