import puppeteer from "puppeteer"
import cheerio from "cheerio"
import { formatData } from "./formatData.js";

async function redirectToEnglishProductPage({ page, logger }) {
	const waitFor = 25
	logger.log(new Date().toISOString(), "Is english url, switching language to english")

	logger.debug(new Date().toISOString(), "Waiting for #switcher-info")
	await page.waitForSelector("#switcher-info", { visible: true })
	logger.debug(new Date().toISOString(), "Clicking #switcher-info")
	await page.click("#switcher-info")

	await new Promise(r => setTimeout(r, 25))
	
	logger.debug(new Date().toISOString(), "Waiting for [data-role='language-input']")
	await page.waitForSelector("[data-role='language-input']", { visible: true })
	logger.debug(new Date().toISOString(), "Clicking [data-role='language-input']")
	await page.click("[data-role='language-input']")
	
	await new Promise(r => setTimeout(r, 25))
	
	logger.debug(new Date().toISOString(), "Waiting for [data-role='language-list']")
	await page.waitForSelector("[data-role='language-list']", { visible: true })
	
	logger.debug(new Date().toISOString(), "Waiting for [data-locale='en_US'][data-site='glo']")
	await page.waitForSelector("[data-locale='en_US'][data-site='glo']", { visible: true })
	logger.debug(new Date().toISOString(), "Clicking [data-locale='en_US'][data-site='glo']")
	await page.click("[data-locale='en_US'][data-site='glo']")
	
	await new Promise(r => setTimeout(r, 25))
	
	logger.debug(new Date().toISOString(), "Clicking save language selection button")
	await page.click(".switcher-btn [data-role=save]")

	logger.debug(new Date().toISOString(), "Awaiting navigation to english product page")
	await page.waitForNavigation({ waitUntil: "load" })
}

async function scrapeProduct({ browser, productUrl, logger, defaultTimeout }) {
	const isEnglishUrl = new URL(productUrl).hostname === "www.aliexpress.com"
	// const FEEDBACK_LIMIT = feedbackLimit || 10;
	
	logger.debug(new Date().toISOString(), "Opening New Page")
	const page = await browser.newPage()

	logger.debug(new Date().toISOString(), "Setting Viewport and user agent and default timeout")
	await page.setViewport({ width: 1920, height: 1080 })
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
	await page.setDefaultTimeout(defaultTimeout)

	logger.debug(new Date().toISOString(), "Setting request interception and listeners")
	await page.setRequestInterception(true)
	
	page.on("request", req => {
		if (["image", "font"].includes(req.resourceType())) {
			req.abort()
		} else {
			req.continue()
		}
	})

	/** Scrape the aliexpress product page for details */
	logger.debug(new Date().toISOString(), "Going to url")
	await page.goto(productUrl, { waitUntil: "load" });

	if (isEnglishUrl) {
		await redirectToEnglishProductPage({page, logger})
	}

	const aliExpressData = await page.evaluate(() => runParams);

	const data = aliExpressData.data;
	logger.debug(`${new Date().toISOString()} data.webEnv.host`, data.webEnv.host)

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
	const json = formatData({ data, descriptionData })

	return json;
}

export default async function AliexpressProductScraper({ productUrl, logger, defaultTimeout }, tryN = 1) {
	let browser = null
	let json = null

	try {
		logger.log(`Scraping ${productUrl}`)
		logger.debug(new Date().toISOString(), "Launching browser")
		browser = await puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } })
		
		const timeBefore = new Date()
		json = await scrapeProduct({ browser, productUrl, logger, defaultTimeout })
		const timeAfter = new Date()

		logger.log(`Scraped after ${(timeAfter - timeBefore) / 1000}s`)
		logger.debug("Product title", json.title)
		await browser.close()
	} catch (error) {
		logger.error("AliexpressProductScraper Catched error", error)
		if (browser?.close) {
			logger.log("Closing browser after exception")
			await browser.close()
		}
	}
	
	return json
}
