import puppeteer from "puppeteer"
import cheerio from "cheerio"
import { formatData } from "./formatData.js";
import { getLocale } from "./localeMap.js";

export const defaultLogger = {
	error: console.error,
	warn: console.warn,
	info: console.info,
	log: console.log,
	debug: console.debug
}



async function scrapeProduct({ browser, productUrl, logger, defaultTimeout, loginCookieValue }) {	
	logger.debug(new Date().toISOString(), "Opening New Page")
	const page = await browser.newPage()

	logger.debug(new Date().toISOString(), "Setting Viewport and user agent and default timeout")
	await page.setViewport({ width: 1920, height: 1080 })
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
	await page.setDefaultTimeout(defaultTimeout)
	
	if (loginCookieValue) {
		logger.debug(new Date().toISOString(), "Setting auth cookie for correct discounted prices")
		await page.setCookie({name: "xman_f", domain: ".aliexpress.com", value: loginCookieValue})
	} else {
		logger.warn(new Date().toISOString(), "No loginCookieValue found")
	}

	logger.debug(new Date().toISOString(), "Setting request interception and listeners")
	await page.setRequestInterception(true)
	
	page.on("request", req => {
		if (["image", "font"].includes(req.resourceType())) {
			req.abort()
		} else {
			req.continue()
		}
	})

	page.on('response', response => {
		const status = response.status()
		const responseUrl = response.url()
		const isAliexpress = new URL(responseUrl).hostname.includes("aliexpress.com") || new URL(responseUrl).hostname.includes("aliexpress.us")
		if ((status >= 300) && (status <= 399) && isAliexpress) {
			logger.log(`${new Date().toISOString()} Redirect from ${responseUrl} to ${response.headers()['location']}`)
		}
	})

	const { locale, site } = getLocale(new URL(productUrl).hostname)
	logger.debug(new Date().toISOString(), "Setting locale cookie aep_usuc_f", { locale, site })
	await page.setCookie({name: "aep_usuc_f", domain: ".aliexpress.com", value: `site=${site}&region=ESP&ups_d=0|0|0|0&b_locale=${locale}&isb=y&ups_u_t=&c_tp=USD&x_alimid=2566327732&ae_u_p_s=1`})

	const validUrl =
		productUrl.includes("aliexpress.ru") ?
			productUrl.replace("aliexpress.ru", "www.aliexpress.com")
		: productUrl
	logger.debug(new Date().toISOString(), "Going to url", validUrl)
	await page.goto(validUrl, { waitUntil: "load" });

	const aliExpressData = await page.evaluate(() => window.runParams);

	const data = aliExpressData.data;
	logger.debug(`${new Date().toISOString()} data.webEnv.host`, data?.webEnv?.host)

	/** Scrape the description page for the product using the description url */
	const descriptionUrl = data.descriptionModule.descriptionUrl;
	await page.goto(descriptionUrl);
	const descriptionPageHtml = await page.content();

	/** Build the AST for the description page html content using cheerio */
	const $ = cheerio.load(descriptionPageHtml);
	const descriptionData = $('body').html();

	await browser.close();

	const json = formatData({ data, descriptionData })

	return json;
}

export default async function AliexpressProductScraper({ productUrl, logger = defaultLogger, defaultTimeout, loginCookieValue = "" }, tryN = 1) {
	let browser = null
	let json = null

	try {
		logger.log(`Scraping ${productUrl}`)
		logger.debug(new Date().toISOString(), "Launching browser")
		browser = await puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 }, args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'] })

		const timeBefore = new Date()
		json = await scrapeProduct({ browser, productUrl, logger, defaultTimeout, loginCookieValue })
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

		if (tryN < 3) {
			logger.log(`Retrying to scrape ${productUrl}. Try number ${tryN + 1}`)
			AliexpressProductScraper({ productUrl, logger, defaultTimeout }, tryN + 1)
		}
	}
	
	return json
}
