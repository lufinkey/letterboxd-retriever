
import * as cheerio from 'cheerio';
import {
	FilmInfo,
	FilmPageData,
	FilmLDJson,
	ActivityFeedPage,
	ActivityFeedEntry } from './types';
import * as lburls from './urls';
import * as lbparse from './parser';

export * from './types';

export const getFilmInfo = async (film: ({slug: string} | {href: string})): Promise<FilmInfo> => {
	let url: string;
	if('slug' in film && film.slug) {
		url = lburls.filmPageURLFromSlug(film.slug);
	} else if('href' in film && film.href) {
		url = lburls.urlFromHref(film.href);
	} else {
		throw new Error(`No slug or href was provided`);
	}
	const res = await fetch(url);
	if(!res.ok) {
		res.body?.cancel();
		throw new Error(res.statusText);
	}
	const resData = await res.text();
	const $ = cheerio.load(resData);
	const ldJson: FilmLDJson = lbparse.parseLdJson($);
	const pageData = lbparse.parseFilmPage($);
	return {
		pageData,
		ldJson
	};
};

export const getUserFollowingFeed = async (username: string, options: {
	after?: number | string | undefined,
	csrf?: string | undefined
} = {}): Promise<ActivityFeedPage> => {
	const feedPageURL = lburls.followingActivityFeedPageURL({
		username: username
	});
	// fetch csrf if needed
	let csrf: string | null | undefined = options.csrf;
	if(!csrf) {
		const res = await fetch(feedPageURL);
		if(!res.ok) {
			throw new Error(res.statusText);
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
		throw new Error(res.statusText);
	}
	const resData = await res.text();
	//console.log(resData);
	const result = lbparse.parseAjaxActivityFeed(resData);
	return {
		...result,
		csrf: csrf
	};
};
