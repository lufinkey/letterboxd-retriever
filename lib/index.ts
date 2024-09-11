
import * as cheerio from 'cheerio';
import {
	Film,
	FilmInfo,
	ActivityFeedPage,
	ReviewsPage,
	PosterSize,
	FilmsPage,
	letterboxdHttpError,
	letterboxdPageError,
	FilmListPage
} from './types';
import * as lburls from './urls';
import * as lbparse from './parser';

export * from './types';
export { BASE_URL } from './urls';

export type FilmURLOptions = lburls.FilmURLOptions;
export type GetFilmOptions = (FilmURLOptions | {tmdbId: string} | {imdbId: string}) & {
	includeAjaxContent?: boolean;
	relatedFilmsPosterSize?: PosterSize;
};

export const getFilmInfo = async (options: GetFilmOptions): Promise<FilmInfo> => {
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
	const res = await fetch(url);
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdHttpError(res.status, res.statusText);
	}
	const resData = await res.text();
	const $ = cheerio.load(resData);
	const ldJson = lbparse.parseLdJson($);
	const pageData = lbparse.parseFilmPage($);
	if(!ldJson && !pageData.name && !pageData.year) {
		const errorPage = lbparse.parseErrorPage($);
		if(errorPage.title) {
			throw letterboxdPageError(errorPage);
		} else {
			throw new Error("Invalid film page");
		}
	}
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && ((pageData?.relatedFilms?.items?.length ?? 0) > 0 || (pageData?.similarFilms?.items?.length ?? 0) > 0)) {
		const itemsToFetch = (pageData.relatedFilms?.items ?? []).concat(pageData.similarFilms?.items ?? []);
		await fetchFilmPostersForItems(itemsToFetch, (film) => film, {posterSize:options.relatedFilmsPosterSize});
	}
	return {
		pageData,
		ldJson
	};
};

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
	const res = await fetch(url, {
		method: 'HEAD'
	});
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdHttpError(res.status, res.statusText);
	}
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

export type GetFriendsReviewsOptions = lburls.FriendsReviewsOptions;

export const getFriendsReviews = async (options: GetFriendsReviewsOptions): Promise<ReviewsPage> => {
	const url = lburls.friendsReviewsURL(options);
	const res = await fetch(url);
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdHttpError(res.status, res.statusText);
	}
	const resData = await res.text();
	return lbparse.parseViewingListPage(resData);
};

export type GetFilmPosterOptions = lburls.FilmURLOptions & {
	posterSize?: PosterSize
};

export const getFilmPoster = async (options: GetFilmPosterOptions): Promise<Film> => {
	const posterOpts = {...options};
	if(!posterOpts.posterSize) {
		posterOpts.posterSize = {width:150,height:225};
	}
	const url = lburls.filmPosterURL(posterOpts as lburls.FilmPosterURLOptions);
	//console.log(`fetching poster from url ${url}`);
	const res = await fetch(url);
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdHttpError(res.status, res.statusText);
	}
	const resData = await res.text();
	return lbparse.parseFilmPosterPage(resData);
};

export const fetchFilmPostersForItems = async <TItem>(
	items: TItem[],
	filmFromItem: ((item: TItem) => Film | undefined),
	options: {posterSize?: PosterSize}): Promise<void> => {
	// fetch film posters for all the items
	const posterPromises: {[href: string]: Promise<Film>} = {};
	await Promise.all(items.map(async (item) => {
		// ensure item has a film
		const film = filmFromItem(item);
		if(!film) {
			return;
		}
		const filmHref = film?.href;
		if(filmHref) {
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
		}
	}));
};

export type GetUserFollowingFeedOptions = {
	after?: number | string | undefined,
	csrf?: string | undefined,
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
		const res = await fetch(feedPageURL);
		if(!res.ok) {
			throw letterboxdHttpError(res.status, res.statusText);
		}
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
	const res = await fetch(feedAjaxURL, {
		referrer: feedPageURL,
		headers: {
			'Host': lburls.HOST
		} 
	});
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdHttpError(res.status, res.statusText);
	}
	const resData = await res.text();
	//console.log(resData);
	const result = lbparse.parseAjaxActivityFeed(resData);
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && (result.items?.length ?? 0) > 0) {
		await fetchFilmPostersForItems(result.items, (item) => item?.film, {posterSize:options.posterSize});
	}
	return {
		...result,
		csrf: csrf
	};
};

export type GetFilmListPageOptions = {href: string} & {
	includeAjaxContent?: boolean,
	posterSize?: {width: number, height: number}
};

export const getFilmListPage = async (options: GetFilmListPageOptions): Promise<FilmListPage> => {
	const url = lburls.urlFromHref(options.href);
	const res = await fetch(url);
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdHttpError(res.status, res.statusText);
	}
	const resData = await res.text();
	const page = lbparse.parseFilmListPage(resData);
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && (page.items?.length ?? 0) > 0) {
		await fetchFilmPostersForItems(page.items, (item) => item.film, {posterSize:options.posterSize});
	}
	return page;
};


export type GetSimilarFilmsOptions = lburls.FilmURLOptions & {
	includeAjaxContent?: boolean;
	posterSize?: {width: number, height: number};
};

export const getSimilar = async (options: GetSimilarFilmsOptions): Promise<FilmsPage> => {
	const url = lburls.similarItemsURL(options);
	const res = await fetch(url);
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdHttpError(res.status, res.statusText);
	}
	const resData = await res.text();
	const page = lbparse.parseFilmsPage(resData);
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && (page.items?.length ?? 0) > 0) {
		await fetchFilmPostersForItems(page.items, (film) => film, {posterSize:options.posterSize});
	}
	return page;
};
