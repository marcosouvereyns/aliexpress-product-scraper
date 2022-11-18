import scrape from "./../index.js"

if (process.argv[2]) {
	const product = scrape({ productUrl: process.argv[2], defaultTimeout: 15000})
} else {
	console.error("No product URL provided.\nProvide using $ npm run start https://www.aliexpress.com/item/1005003980657298.html")
}