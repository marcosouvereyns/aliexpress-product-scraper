# Aliexpress Product Scraper

Forked from [sudheer-ranga/aliexpress-product-scraper](https://github.com/sudheer-ranga/aliexpress-product-scraper)

Aliexpress Product Scraper scrapes product information and returns the response in json format including:

- Description
- Feedback
- Variants and Prices

# How to use?

```
npm i @marcosouvereyns/aliexpress-product-scraper
```

```
const scrape = require('aliexpress-product-scraper');
const params = {
	productUrl: 'https://www.aliexpress.com/item/1005003980657298.html', // Product URL from any aliexpress domain
	defaultTimeout: 15000 // In ms. Overwrites 30s default Puppeteer timeout for awaiting page navigation, awaiting selectors, etc.
	logger: { // Use your logger of preference: Winston, bunyan...
		error: console.error,
		warn: console.warn,
		info: console.info,
		log: console.log,
		debug: console.debug
	}
}
const product = scrape();

product.then(res => {
  console.log('The JSON: ', res);
});
```

# Sample JSON Response

```
{
	"title": "New Design Epoxy Rings Clear Wood Resin Ring Fashion Handmade Dried Flower Epoxy Wedding Jewelry Love Ring for Women",
	"categoryId": 100007323,
	"productId": 32958933105,
	"totalAvailableQuantity": 96357,
	"description": "<div class=\"detailmodule_html\">Product description...</div",
	"orders": 3332,
	"storeInfo": {
		"name": "souleather Handmade Store",
		"companyId": 240403835,
		"storeNumber": 3188009,
		"followers": 1519,
		"ratingCount": 14458,
		"rating": "97.2%"
	},
	"ratings": {
		"totalStar": 5,
		"averageStar": "4.7",
		"totalStartCount": 1313,
		"fiveStarCount": 1072,
		"fourStarCount": 151,
		"threeStarCount": 49,
		"twoStarCount": 11,
		"oneStarCount": 19
	},
	"variants": {
		"options": [{
			"id": 200000369,
			"name": "Ring Size",
			"values": [{
				"id": 200000287,
				"name": "6.5",
				"displayName": "6.5"
			}, ...]
		}, {
			"id": 200000783,
			"name": "Main Stone Color",
			"values": [{
				"id": 29,
				"name": "White",
				"displayName": "A",
				"image": "https://ae01.alicdn.com/kf/HTB1C736aITxK1Rjy0Fgq6yovpXaq/Dropship-New-Design-Epoxy-Rings-Clear-Wood-Resin-Ring-Fashion-Handmade-Dried-Flower-Epoxy-Wedding-Jewelry.jpg_640x640.jpg"
			}, ...]
		}],
		"prices": [{
			"skuId": 10000000089510726,
			"optionValueIds": "100010420,200003699",
			"availableQuantity": 985,
			"originalPrice": 2.9,
			"salePrice": 1.59
		}, ...]
	},
	"specs": [{
		"attrName": "Brand Name",
		"attrNameId": 2,
		"attrValue": "souleather",
		"attrValueId": "4608630006"
	}, ...],
	"currency": "USD",
	"originalPrice": {
		"min": 2.9,
		"max": 6.9
	},
	"salePrice": {
		"min": 1.59,
		"max": 3.79
	}
}
```

