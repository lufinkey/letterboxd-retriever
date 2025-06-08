import { BASE_URL } from './constants';
import { stringifyHrefFilterProps } from './href';
import { PosterSize } from './types';
import {
	FilmReviewsHrefArgs,
	HrefFilterProps,
	ReviewsHrefArgs,
	TagReviewsHrefArgs,
	UserFilmLikedReviewsHrefArgs,
	UserFilmReviewsHrefArgs,
	UserFriendsFilmReviewsHrefArgs,
	UserFriendsTagReviewsHrefArgs,
	UserLikedReviewsHrefArgs,
	UserReviewsHrefArgs,
	UserTagReviewsHrefArgs
} from './types/href';



export const urlFromHref = (href: string) => {
	if(href.indexOf('://') !== -1) {
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



// Film

export const filmHrefFromSlug = (slug: string) => {
	return `/film/${slug}/`;
};
export const filmHrefFromTmdbID = (tmdbId: string) => {
	return `/tmdb/${tmdbId}/`;
};
export const filmHrefFromImdbID = (imdbId: string) => {
	return `/imdb/${imdbId}/`;
};

export const filmPageURLFromSlug = (slug: string) => {
	return BASE_URL + filmHrefFromSlug(slug);
};
export const filmPageURLFromTmdbID = (tmdbId: string) => {
	return BASE_URL + filmHrefFromTmdbID(tmdbId);
};
export const filmPageURLFromImdbID = (imdbId: string) => {
	return BASE_URL + filmHrefFromImdbID(imdbId);
};

export type FilmHrefOptions = ({filmSlug: string} | {href: string});

export const filmHref = (opts: FilmHrefOptions): string => {
	if('href' in opts && opts.href != null) {
		return opts.href;
	} else if('filmSlug' in opts && opts.filmSlug != null) {
		return filmHrefFromSlug(opts.filmSlug);
	}
	throw new Error("No href or slug provided");
};

export const filmURL = (opts: FilmHrefOptions): string => {
	return BASE_URL + filmHref(opts);
};



// Film Poster

export type FilmPosterURLOptions = FilmHrefOptions & {
	posterSize: PosterSize
};

export const filmPosterURL = (opts: FilmPosterURLOptions) => {
	let url = `${BASE_URL}/ajax/poster`;
	url += filmHref(opts);
	if(!url.endsWith('/')) {
		url += '/';
	}
	url += `std/${opts.posterSize.width}x${opts.posterSize.height}`;
	return url;
};



// Activity

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

export const followingActivityFeedPageURL = (options: {
	username: string
}) => {
	return `${BASE_URL}/${options.username}/activity/following`;
};

export const followingActivityFeedAjaxURL = (options: {
    username: string,
    csrf: string,
    after?: number | string | null | undefined,
}) => {
	let url = `${BASE_URL}/ajax/activity-pagination/${options.username}/following/?__csrf=${options.csrf}`;
    if(options.after != null) {
        url += `&after=${options.after}`;
    }
    return url;
};



// Reviews

export type ReviewsHrefOptions = (
	{href: string}
	// /reviews/popular/
	| (ReviewsHrefArgs)
	// /film/<filmSlug>/reviews/
	| ({filmSlug: string;}
		& FilmReviewsHrefArgs)
	// /tag/<tagSlug>/reviews/
	| ({tagSlug: string;}
		& TagReviewsHrefArgs)
	// /<userSlug>/films/reviews/
	| ({userSlug: string;}
		& UserReviewsHrefArgs)
	// /<userSlug>/film/<filmSlug>/reviews/
	| (
		{
			userSlug: string;
			filmSlug: string;
		} & UserFilmReviewsHrefArgs
	)
	// /<userSlug>/friends/film/<filmSlug>/reviews/
	| (
		{
			userSlug: string;
			friends: true;
			filmSlug: string;
		} & UserFriendsFilmReviewsHrefArgs
	)
	// /<userSlug>/film/<filmSlug>/likes/reviews/
	| (
		{
			userSlug: string;
			likes: true;
			filmSlug: string;
		} & UserFilmLikedReviewsHrefArgs
	)
	// /<userSlug>/likes/reviews/
	| (
		{
			userSlug: string;
			likes: true;
		} & UserLikedReviewsHrefArgs
	)
	// /<userSlug>/tag/<tagSlug>/reviews/
	| (
		{
			userSlug: string;
			tagSlug: string;
		} & UserTagReviewsHrefArgs
	)
	// /<userSlug>/friends/tag/<tagSlug>/reviews
	| (
		{
			userSlug: string;
			friends: true;
			tagSlug: string;
		} & UserFriendsTagReviewsHrefArgs
	)
);

export const reviewsHref = (opts: ReviewsHrefOptions): string => {
	if((opts as {href:string}).href != null) {
		return (opts as {href:string}).href;
	}
	// create trailing href with filters
	let hrefFilters = stringifyHrefFilterProps(opts as HrefFilterProps);
	if(hrefFilters && !hrefFilters.endsWith('/')) {
		hrefFilters += '/';
	}
	// stringify different href cases
	const { filmSlug, tagSlug, userSlug, friends, likes } = opts as {
		filmSlug: (string | undefined),
		tagSlug: (string | undefined),
		userSlug: (string | undefined),
		friends: (true | undefined),
		likes: (true | undefined)
	};
	if(userSlug != null) {
		if(filmSlug != null) {
			if(friends) {
				return `/${userSlug}/friends/film/${filmSlug}/reviews/${hrefFilters}`;
			} else if(likes) {
				return `/${userSlug}/film/${filmSlug}/likes/reviews/${hrefFilters}`;
			} else {
				return `/${userSlug}/film/${filmSlug}/reviews/${hrefFilters}`;
			}
		} else if(tagSlug != null) {
			if(friends) {
				return `/${userSlug}/friends/tag/${tagSlug}/reviews/${hrefFilters}`;
			} else {
				return `${userSlug}/tag/${tagSlug}/reviews/${hrefFilters}`;
			}
		} else {
			if(likes) {
				return `/${userSlug}/likes/reviews/${hrefFilters}`;
			} else {
				return `/${userSlug}/films/reviews/${hrefFilters}`;
			}
		}
	} else if(filmSlug != null) {
		return `/film/${filmSlug}/reviews/${hrefFilters}`;
	} else if(tagSlug != null) {
		return `/tag/${tagSlug}/reviews/${hrefFilters}`;
	} else {
		return `/reviews/${hrefFilters}`;
	}
};

export const reviewsURL = (opts: ReviewsHrefOptions): string => {
	return BASE_URL + reviewsHref(opts);
};



// Similar Items

export const similarItemsHref = (opts: FilmHrefOptions) => {
	let href = filmHref(opts);
	if(!href.endsWith('/')) {
		href += '/';
	}
	href += 'similar';
	return href;
};

export const similarItemsURL = (options: FilmHrefOptions) => {
	return BASE_URL + similarItemsHref(options);
};
