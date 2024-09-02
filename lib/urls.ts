
export const HOST = 'letterboxd.com';
export const BASE_URL = `https://${HOST}`;

export interface PersonalActivityFeedOptions {
	diaryEntries?: boolean;
	reviews?: boolean;
	lists?: boolean;
	stories?: boolean;
	reviewComments?: boolean;
	listComments?: boolean;
	storyComments?: boolean;
	watchlistAdditions?: boolean;
	reviewLikes?: boolean;
	listLikes?: boolean;
	storyLikes?: boolean;
	follows?: boolean;
	yourActivity?: boolean;
	incomingActivity?: boolean;
}

export type FilmURLOptions = ({filmSlug: string} | {href: string});

export const urlFromHref = (href: string) => {
	if(href.indexOf(':') !== -1) {
		return href;
	}
	if(!href.startsWith('/')) {
		console.warn(`href ${href} is not an absolute path`);
		return `${BASE_URL}/${href}`;
	}
	return `${BASE_URL}${href}`;
};

export const hrefFromURL = (url: string) => {
	if(url.startsWith(BASE_URL)) {
		url = url.substring(BASE_URL.length);
	}
	return url;
};

export const filmPageURLFromSlug = (slug: string) => {
	return `${BASE_URL}/film/${slug}`;
};

export const filmPageURLFromTmdbID = (tmdbId: string) => {
	return `${BASE_URL}/tmdb/${tmdbId}`;
};

export const filmPageURLFromImdbID = (imdbId: string) => {
	return `${BASE_URL}/imdb/${imdbId}`;
};

export type FriendsReviewsOptions = {
	username: string;
} & FilmURLOptions;

export const friendsReviewsURL = (options: FriendsReviewsOptions) => {
	let url = `${BASE_URL}/${options.username}/friends`;
	if('filmSlug' in options && options.filmSlug) {
		url += `/film/${options.filmSlug}`;
	} else if('href' in options && options.href) {
		url += options.href;
	} else {
		throw new Error("No id provided");
	}
	url += '/reviews';
	return url;
};

export const filmPosterURL = (options: {
	slug: string,
	width: number,
	height: number
}) => {
	return `${BASE_URL}/ajax/poster/film/${options.slug}/std/${options.width}x${options.height}`;
};

export const followingActivityFeedPageURL = (options: {
	username: string
}) => {
	return `${BASE_URL}/${options.username}/activity/following`;
};

export const followingActivityFeedAjaxURL = (options: {
    username: string,
    csrf: string,
    after?: number | string | undefined,
}) => {
	let url = `${BASE_URL}/ajax/activity-pagination/${options.username}/following/?__csrf=${options.csrf}`;
    if(options.after != null) {
        url += `&after=${options.after}`;
    }
    return url;
};
