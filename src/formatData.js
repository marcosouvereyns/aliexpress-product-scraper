import variants from "./variants.js";

export const formatData = ({ data, descriptionData }) => ({
	title: data.titleModule.subject.replace(/&lt;/g , "<").replace(/&gt;/g , ">").replace(/&quot;/g , "\"").replace(/&#39;/g , "\'").replace(/&amp;/g , "&"),
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
	images: (data.imageModule && data.imageModule.imagePathList) || [],
	// feedback: feedbackData,
	variants: variants.get(data.skuModule),
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
})