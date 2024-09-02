
import * as cheerio from 'cheerio';
import {
	Film,
	FilmInfo,
	ActivityFeedPage,
	ReviewsPage,
	letterboxdError
} from './types';
import * as lburls from './urls';
import * as lbparse from './parser';

export * from './types';
export { BASE_URL } from './urls';

export type GetFilmInfoOptions = ({filmSlug: string} | {href: string} | {tmdbId: string} | {imdbId: string});

export const getFilmInfo = async (film: GetFilmInfoOptions): Promise<FilmInfo> => {
	let url: string;
	if('filmSlug' in film && film.filmSlug) {
		url = lburls.filmPageURLFromSlug(film.filmSlug);
	} else if('href' in film && film.href) {
		url = lburls.urlFromHref(film.href);
	} else if('tmdbId' in film && film.tmdbId) {
		url = lburls.filmPageURLFromTmdbID(film.tmdbId);
	} else if('imdbId' in film && film.imdbId) {
		url = lburls.filmPageURLFromImdbID(film.imdbId);
	} else {
		throw new Error(`No slug, href, or id was provided`);
	}
	const res = await fetch(url);
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdError(res.status, res.statusText);
	}
	const resData = await res.text();
	const $ = cheerio.load(resData);
	const ldJson = lbparse.parseLdJson($);
	const pageData = lbparse.parseFilmPage($);
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
		throw letterboxdError(res.status, res.statusText);
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
		throw letterboxdError(res.status, res.statusText);
	}
	const resData = await res.text();
	return lbparse.parseViewingListPage(resData);
};

export type GetFilmPosterOptions = {
	slug: string,
	width: number,
	height: number
};

export const getFilmPoster = async (options: GetFilmPosterOptions): Promise<Film> => {
	const url = lburls.filmPosterURL(options);
	const res = await fetch(url);
	if(!res.ok) {
		res.body?.cancel();
		throw letterboxdError(res.status, res.statusText);
	}
	const resData = await res.text();
	return lbparse.parsePosterPage(resData);
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
			throw letterboxdError(res.status, res.statusText);
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
		throw letterboxdError(res.status, res.statusText);
	}
	const resData = await res.text();
	//console.log(resData);
	const result = lbparse.parseAjaxActivityFeed(resData);
	// fetch ajax content if needed
	if((options.includeAjaxContent ?? true) && (result.items?.length ?? 0) > 0) {
		const posterSize = options.posterSize ?? {width: 140,height:210};
		const posterPromises: {[slug: string]: Promise<Film>} = {};
		result.items = await Promise.all(result.items.map(async (item) => {
			if(item.film) {
				if(!item.film.imageURL || !item.film.year) {
					const filmSlug = item.film.slug;
					let promise = posterPromises[filmSlug];
					if(!promise) {
						promise = getFilmPoster({
							slug: filmSlug,
							width: posterSize.width,
							height: posterSize.height
						});
						posterPromises[filmSlug] = promise;
					}
					const film = await promise;
					item.film.imageURL = film.imageURL;
					item.film.year = film.year;
				}
			}
			return item;
		}));
	}
	return {
		...result,
		csrf: csrf
	};
};
