const localeMap = {
	us: { locale: 'en_US', site: 'glo' },
	ru: { locale: 'ru_RU', site: 'rus' },
	pt: { locale: 'pt_BR', site: 'bra' },
	es: { locale: 'es_ES', site: 'esp' },
	fr: { locale: 'fr_FR', site: 'fra' },
	pl: { locale: 'pl_PL', site: 'pol' },
	il: { locale: 'iw_IL', site: 'isr' },
	it: { locale: 'it_IT', site: 'ita' },
	tr: { locale: 'tr_TR', site: 'tur' },
	de: { locale: 'de_DE', site: 'deu' },
	ko: { locale: 'ko_KR', site: 'kor' },
	ar: { locale: 'ar_MA', site: 'ara' },
	ja: { locale: 'ja_JP', site: 'jpn' },
	nl: { locale: 'nl_NL', site: 'nld' },
	th: { locale: 'th_TH', site: 'tha' },
	vi: { locale: 'vi_VN', site: 'vnm' },
	id: { locale: 'in_ID', site: 'idn' }
}

export const getLocale = (hostname) => {
	const domain = hostname.split(".")[0]
	if (hostname.endsWith("us")) {
		return localeMap.us
	} else if (hostname.endsWith("ru")) {
		return localeMap.us
	} else if (hostname.startsWith("he")) {
		return localeMap.il
	} else if (domain in localeMap) {
		return localeMap[domain]
	} else {
		return localeMap.us
	}
}