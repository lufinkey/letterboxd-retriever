
import * as cheerio from 'cheerio';
import {
	Film,
	FilmPage,
	ActivityFeedPage,
	ReviewsPage,
	PosterSize,
	FilmsPage,
	letterboxdHttpError,
	letterboxdPageError,
	FilmListPage,
} from './types';
import * as lbconstants from './constants';
import * as lburls from './urls';
import * as lbparse from './parser';

export * from './types';
export { parseHref } from './href';
export { HOST, BASE_URL } from './constants';


// base methods

const sendHttpRequest = async (url: string, options?: RequestInit): Promise<Response> => {
	const res = await fetch(url, options);
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdHttpError(url, res);
	}
	return res;
};



// Film

export type FilmURLOptions = lburls.FilmHrefOptions;
export type GetFilmOptions = (FilmURLOptions | {tmdbId: string} | {imdbId: string}) & {
	includeAjaxContent?: boolean;
	relatedFilmsPosterSize?: PosterSize;
};

export const getFilm = async (options: GetFilmOptions): Promise<FilmPage> => {
	let url: string;
	if('filmSlug' in options && options.filmSlug) {
		url = lburls.filmPageURLFromSlug(options.filmSlug);
	} else if('href' in options && options.href) {
		url = lburls.urlFromHref(options.href);
	} else if('tmdbId' in options && options.tmdbId) {
		url = lburls.filmPageURLFromTmdbID(options.tmdbId);
	} else if('imdbId' in options && options.imdbId) {
		url = lburls.filmPageURLFromImdbID(options.imdbId);
	} else {
		throw new Error(`No slug, href, or id was provided`);
	}
	const res = await sendHttpRequest(url);
	const resData = await res.text();
	const $ = cheerio.load(resData);
	const ldJson = lbparse.parseLdJson($);
	const pageData = lbparse.parseFilmPage($);
	if(!ldJson && !pageData.name && !pageData.year) {
		const errorPage = lbparse.parseErrorPage($);
		if(errorPage.title) {
			throw letterboxdPageError(errorPage, url, res);
		} else {
			throw new Error("Invalid film page");
		}
	}
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && ((pageData?.relatedFilms?.items?.length ?? 0) > 0 || (pageData?.similarFilms?.items?.length ?? 0) > 0)) {
		const itemsToFetch = (pageData.relatedFilms?.items ?? []).concat(pageData.similarFilms?.items ?? []);
		await fetchFilmPostersForItems(itemsToFetch, (item, callback) => callback(item), {posterSize:options.relatedFilmsPosterSize});
	}
	return {
		pageData,
		ldJson
	};
};



// Film ID from External ID

export type GetFilmFromExternalIDOptions = ({tmdbId: string} | {imdbId: string});

export const getFilmHrefFromExternalID = async (options: GetFilmFromExternalIDOptions): Promise<string | null> => {
	let url: string;
	if('tmdbId' in options && options.tmdbId) {
		url = lburls.filmPageURLFromTmdbID(options.tmdbId);
	} else if('imdbId' in options && options.imdbId) {
		url = lburls.filmPageURLFromImdbID(options.imdbId);
	} else {
		throw new Error(`No external id was provided`);
	}
	const res = await sendHttpRequest(url, {
		method: 'HEAD'
	});
	const filmHref = lburls.hrefFromURL(res.url);
	let cmpHref = filmHref;
	if(filmHref.endsWith('/')) {
		if(!url.endsWith('/')) {
			cmpHref = cmpHref.substring(0, cmpHref.length-1);
		}
	} else {
		if(url.endsWith('/')) {
			cmpHref += '/';
		}
	}
	res.body?.cancel();
	if(url.endsWith(cmpHref)) {
		return null;
	}
	return filmHref;
};

export const getFilmSlugFromExternalID = async (options: GetFilmFromExternalIDOptions): Promise<string | null> => {
	const href = await getFilmHrefFromExternalID(options);
	if(!href) {
		return null;
	}
	const hrefParts = lbparse.trimString(href, '/').split('/');
	if(hrefParts[0] != 'film') {
		throw new Error(`Invalid film href ${href}`);
	}
	return hrefParts[1];
};



// Film Poster

export type GetFilmPosterOptions = lburls.FilmHrefOptions & {
	posterSize?: PosterSize
};

export const getFilmPoster = async (options: GetFilmPosterOptions): Promise<Film> => {
	const posterOpts = {...options};
	if(!posterOpts.posterSize) {
		posterOpts.posterSize = {width:150,height:225};
	}
	const url = lburls.filmPosterURL(posterOpts as lburls.FilmPosterURLOptions);
	//console.log(`fetching poster from url ${url}`);
	const res = await sendHttpRequest(url);
	const resData = await res.text();
	return lbparse.parseFilmPosterPage(resData);
};

const fetchFilmPostersForItems = async <TItem>(
	items: TItem[],
	forEachFilm: ((item: TItem, callback: (film: Film) => Promise<void>) => Promise<void>),
	options: {posterSize?: PosterSize}): Promise<void> => {
	// fetch film posters for all the items
	const posterPromises: {[href: string]: Promise<Film>} = {};
	await Promise.all(items.map(async (item) => {
		// ensure item has a film
		await forEachFilm(item, async (film) => {
			if(!film) {
				return;
			}
			const filmHref = film?.href;
			if(!filmHref) {
				return;
			}
			// fetch the poster or wait for task already in progress
			let promise = posterPromises[filmHref];
			if(!promise) {
				promise = getFilmPoster({
					href: filmHref,
					posterSize: options.posterSize
				});
				posterPromises[filmHref] = promise;
			}
			try {
				const fetchedFilm = await promise;
				// apply fetched data
				if(fetchedFilm.imageURL) {
					film.imageURL = fetchedFilm.imageURL;
				}
				if(fetchedFilm.year) {
					film.year = fetchedFilm.year;
				}
			} catch(error) {
				console.warn(error);
			}
		});
	}));
};



// Activity

export type GetUserFollowingFeedOptions = {
	after?: number | string | null | undefined,
	csrf?: string | null | undefined,
	includeAjaxContent?: boolean,
	posterSize?: {width: number, height: number}
};

export const getUserFollowingFeed = async (username: string, options: GetUserFollowingFeedOptions = {}): Promise<ActivityFeedPage> => {
	const feedPageURL = lburls.followingActivityFeedPageURL({
		username: username
	});
	// fetch csrf if needed
	let csrf: string | null | undefined = options.csrf;
	if(!csrf) {
		const res = await sendHttpRequest(feedPageURL);
		const resData = await res.text();
		csrf = lbparse.parseCSRF(resData);
		if(!csrf) {
			throw new Error("Failed to fetch CSRF");
		}
	}
	// fetch activity feed
	const feedAjaxURL = lburls.followingActivityFeedAjaxURL({
		...options,
		username: username,
		csrf: csrf
	});
	const res = await sendHttpRequest(feedAjaxURL, {
		referrer: feedPageURL,
		headers: {
			'Host': lbconstants.HOST
		}
	});
	const resData = await res.text();
	//console.log(resData);
	const result = lbparse.parseAjaxActivityFeed(resData);
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && (result.items?.length ?? 0) > 0) {
		await fetchFilmPostersForItems(result.items, async (item, callback) => {
			if(item.filmList?.films) {
				await Promise.all(item.filmList.films.map(callback));
			}
			if(item.film) {
				await callback(item.film);
			}
		}, {posterSize:options.posterSize});
	}
	return {
		...result,
		csrf: csrf
	};
};



// Reviews

export type GetReviewsOptions = lburls.ReviewsHrefOptions;

export const getReviews = async (options: GetReviewsOptions): Promise<ReviewsPage> => {
	const url = lburls.reviewsURL(options);
	const res = await sendHttpRequest(url);
	const resData = await res.text();
	return lbparse.parseViewingListPage(resData);
};



// Films

export type GetFilmsOptions = lburls.FilmsHrefOptions & {
	includeAjaxContent?: boolean;
	posterSize?: {width: number, height: number};
};

export const getFilms = async (options: GetFilmsOptions): Promise<FilmsPage> => {
	const url = lburls.filmsURL(options);
	const res = await sendHttpRequest(url);
	const resData = await res.text();
	const $ = cheerio.load(resData);
	let page = lbparse.parseFilmsPage($);
	if(!page?.items || page.items.length == 0) {
		// check if page should be parsed from an ajax call
		const ajaxHref = lbparse.parseAjaxHrefFromFilmsPage($);
		if(ajaxHref) {
			// fetch ajax page
			const ajaxUrl = lburls.urlFromHref(ajaxHref);
			const ajaxRes = await sendHttpRequest(ajaxUrl);
			const ajaxResData = await ajaxRes.text();
			page = lbparse.parseFilmsPage(`<body id="root">${ajaxResData}</body>`);
		}
	}
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && (page.items?.length ?? 0) > 0) {
		await fetchFilmPostersForItems(page.items, (item, callback) => callback(item), {posterSize:options.posterSize});
	}
	return page;
};

export type GetSimilarFilmsOptions = lburls.SimilarToFilmHrefOptions & {
	includeAjaxContent?: boolean;
	posterSize?: {width: number, height: number};
};

export const getSimilarFilms = async (options: GetSimilarFilmsOptions): Promise<FilmsPage> => {
	const href = lburls.similarItemsHref(options);
	return await getFilms({
		href,
		includeAjaxContent: options.includeAjaxContent,
		posterSize: options.posterSize,
	});
};



// Film List

export type GetFilmListOptions = lburls.FilmListHrefOptions & {
	includeAjaxContent?: boolean,
	posterSize?: {width: number, height: number}
};

export const getFilmList = async (options: GetFilmListOptions): Promise<FilmListPage> => {
	const url = lburls.filmListURL(options);
	const res = await sendHttpRequest(url);
	const resData = await res.text();
	const $ = cheerio.load(resData);
	let page = lbparse.parseFilmListPage($);
	if(!page) {
		// check if page should be parsed from an ajax call
		const ajaxHref = lbparse.parseAjaxHrefFromFilmsPage($);
		if(ajaxHref) {
			// fetch ajax page
			const ajaxUrl = lburls.urlFromHref(ajaxHref);
			const ajaxRes = await sendHttpRequest(ajaxUrl);
			const ajaxResData = await ajaxRes.text();
			page = lbparse.parseFilmListPage(`<body id="root">${ajaxResData}</body>`);
		}
	}
	if(!page) {
		throw new Error(`Invalid film list`);
	}
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && (page.items?.length ?? 0) > 0) {
		await fetchFilmPostersForItems(page.items, (item, callback) => callback(item.film), {posterSize:options.posterSize});
	}
	return page;
};
