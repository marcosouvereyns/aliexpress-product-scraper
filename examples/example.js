const scrape = require('./../index.js');

if (process.argv[2]) {
	const product = scrape(process.argv[2])
} else {
	console.error("No url provided")
}