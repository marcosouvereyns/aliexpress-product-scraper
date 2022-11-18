import scrape from "./../index.js"

const logger = {
	error: console.error,
	warn: console.warn,
	info: console.info,
	log: console.log,
	debug: console.debug,
}

if (process.argv[2]) {
	const product = scrape({ productUrl: process.argv[2], logger, defaultTimeout: 15000})
} else {
	console.error("No url provided")
}