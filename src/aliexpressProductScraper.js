const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const Variants = require('./variants');
const Feedback = require('./feedback');

async function scrapeProduct(browser, productUrl) {
	const isEnglishUrl = new URL(productUrl).hostname === "www.aliexpress.com"
	// const FEEDBACK_LIMIT = feedbackLimit || 10;
	
	console.log(new Date().toISOString(), "Opening New Page")
	const page = await browser.newPage();

	console.log(new Date().toISOString(), "Setting Viewport and user agent")
	await page.setViewport({ width: 1920, height: 1080 })
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
	
	console.log(new Date().toISOString(), "Setting request interception")
	await page.setRequestInterception(true)
	page.on("request", req => {
		if (["image", "font", "stylesheet"].includes(req.resourceType())) {
			req.abort()
		}
		else {
			req.continue()
		}
	})

	/** Scrape the aliexpress product page for details */
	console.log(new Date().toISOString(), "Going to url")
	await page.goto(productUrl, { waitUntil: "load" });

	if (isEnglishUrl) {
		console.log(new Date().toISOString(), "Is english url")

		console.log(new Date().toISOString(), "Waiting for #switcher-info and clicking")
		await page.waitForSelector("#switcher-info")
		await page.click("#switcher-info")

		console.log(new Date().toISOString(), "Waiting for [data-role='language-input'] and clicking")
		await page.waitForSelector("[data-role='language-input']")
		await page.click("[data-role='language-input']")

		console.log(new Date().toISOString(), "Waiting for [data-role='language-list']")
		await page.waitForSelector("[data-role='language-list']")

		console.log(new Date().toISOString(), "Waiting for [data-locale='en_US'][data-site='glo'] and clicking")
		await page.waitForSelector("[data-locale='en_US'][data-site='glo']")
		await page.click("[data-locale='en_US'][data-site='glo']")

		console.log(new Date().toISOString(), "Clicking save language selection button")
		await page.click(".switcher-btn [data-role=save]")

		console.log(new Date().toISOString(), "Awaiting navigation to english product page")
		await page.waitForNavigation({ waitUntil: "load" })
	}

	const aliExpressData = await page.evaluate(() => runParams);

	const data = aliExpressData.data;
	console.log(`${new Date().toISOString()} data.webEnv.host`, data.webEnv.host)

	/** Scrape the description page for the product using the description url */
	const descriptionUrl = data.descriptionModule.descriptionUrl;
	await page.goto(descriptionUrl);
	const descriptionPageHtml = await page.content();

	/** Build the AST for the description page html content using cheerio */
	const $ = cheerio.load(descriptionPageHtml);
	const descriptionData = $('body').html();

	/** Fetch the adminAccountId required to fetch the feedbacks */
	// const adminAccountId = await page.evaluate(() => adminAccountId);

	// let feedbackData = [];

	// if (data.titleModule.feedbackRating.totalValidNum > 0) {
	// 	feedbackData = await Feedback.get(
	// 		data.actionModule.productId,
	// 		adminAccountId,
	// 		data.titleModule.feedbackRating.totalValidNum,
	// 		FEEDBACK_LIMIT
	// 	);
	// }

	await browser.close();

	/** Build the JSON response with aliexpress product details */
	const json = {
		title: data.titleModule.subject,
		categoryId: data.actionModule.categoryId,
		productId: data.actionModule.productId,
		totalAvailableQuantity: data.quantityModule.totalAvailQuantity,
		description: descriptionData,
		orders: data.titleModule.tradeCount,
		storeInfo: {
			name: data.storeModule.storeName,
			companyId: data.storeModule.companyId,
			storeNumber: data.storeModule.storeNum,
			followers: data.storeModule.followingNumber,
			ratingCount: data.storeModule.positiveNum,
			rating: data.storeModule.positiveRate
		},
		ratings: {
			totalStar: 5,
			averageStar: data.titleModule.feedbackRating.averageStar,
			totalStartCount: data.titleModule.feedbackRating.totalValidNum,
			fiveStarCount: data.titleModule.feedbackRating.fiveStarNum,
			fourStarCount: data.titleModule.feedbackRating.fourStarNum,
			threeStarCount: data.titleModule.feedbackRating.threeStarNum,
			twoStarCount: data.titleModule.feedbackRating.twoStarNum,
			oneStarCount: data.titleModule.feedbackRating.oneStarNum
		},
		images:
			(data.imageModule &&
				data.imageModule.imagePathList) ||
			[],
		// feedback: feedbackData,
		variants: Variants.get(data.skuModule),
		specs: data.specsModule.props,
		currency: data.webEnv.currency,
		originalPrice: {
			min: data.priceModule.minAmount.value,
			max: data.priceModule.maxAmount.value
		},
		salePrice: {
			min: data.priceModule.minActivityAmount
				? data.priceModule.minActivityAmount.value
				: data.priceModule.minAmount.value,
			max: data.priceModule.maxActivityAmount
				? data.priceModule.maxActivityAmount.value
				: data.priceModule.maxAmount.value,
		}
	};

	return json;
}

async function AliexpressProductScraper(productUrl, feedbackLimit) {
	let browser = null
	let json = null

	try {
		console.log(new Date().toISOString(), "Launching browser")
		browser = await puppeteer.launch();
		console.time(`${productUrl} Scraped`)
		json = await scrapeProduct(browser, productUrl)
		console.timeEnd(`${productUrl} Scraped`)
		console.log("Product title", json.title)
	} catch (error) {
		console.error("AliexpressProductScraper Catched error", error)
		if (browser?.close) {
			console.log("Closing browser after exception")
			await browser.close()
		}
	}
	
	return json
}

module.exports = AliexpressProductScraper;
