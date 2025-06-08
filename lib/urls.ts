import { BASE_URL } from './constants';
import { stringifyHrefFilterProps } from './href';
import { PosterSize } from './types';
import {
	FilmReviewsHrefArgs,
	FilmsHrefArgs,
	HrefFilterProps,
	ListHrefArgs,
	ReviewsHrefArgs,
	SimilarToFilmHrefArgs,
	TagFilmsHrefArgs,
	TagReviewsHrefArgs,
	UserFilmLikedReviewsHrefArgs,
	UserFilmReviewsHrefArgs,
	UserFilmsHrefArgs,
	UserFriendsFilmReviewsHrefArgs,
	UserFriendsTagReviewsHrefArgs,
	UserLikedFilmsHrefArgs,
	UserLikedReviewsHrefArgs,
	UserReviewsHrefArgs,
	UserTagFilmsHrefArgs,
	UserTagReviewsHrefArgs,
	UserWatchlistHrefArgs
} from './types/href';



export const urlFromHref = (href: string) => {
	if(href.startsWith('/')) {
		return `${BASE_URL}${href}`;
	} else if(href.indexOf('://') !== -1) {
		// href is already a url
		return href;
	}
	console.warn(`href ${href} is not an absolute path`);
	return `${BASE_URL}/${href}`;
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
	return urlFromHref(filmHrefFromSlug(slug));
};
export const filmPageURLFromTmdbID = (tmdbId: string) => {
	return urlFromHref(filmHrefFromTmdbID(tmdbId));
};
export const filmPageURLFromImdbID = (imdbId: string) => {
	return urlFromHref(filmHrefFromImdbID(imdbId));
};

export type FilmHrefOptions = ({filmSlug: string} | {href: string});

export const filmHref = (opts: FilmHrefOptions): string => {
	if('href' in opts && opts.href != null) {
		return hrefFromURL(opts.href);
	} else if('filmSlug' in opts && opts.filmSlug != null) {
		return filmHrefFromSlug(opts.filmSlug);
	}
	throw new Error("No href or slug provided");
};

export const filmURL = (opts: FilmHrefOptions): string => {
	return urlFromHref(filmHref(opts));
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
	return urlFromHref(reviewsHref(opts));
};



// Films

export type FilmsHrefOptions = (
	{href: string}
	// /films/
	| (FilmsHrefArgs)
	// /tag/<tagSlug>/films/
	| ({tagSlug: string}
		& TagFilmsHrefArgs)
	// /<userSlug>/films/
	| ({userSlug: string}
		& UserFilmsHrefArgs)
	// /film/<filmSlug>/similar/
	| (
		{
			filmSlug: string;
			similar: true;
		} & SimilarToFilmHrefArgs
	)
	// /<userSlug>/watchlist/
	| (
		{
			userSlug: string;
			watchlist: true;
		} & UserWatchlistHrefArgs
	)
	// /<userSlug>/likes/films/
	| (
		{
			userSlug: string;
			likes: true;
		} & UserLikedFilmsHrefArgs
	)
	// /<userSlug>/tag/<tagSlug>/films/
	| (
		{
			userSlug: string;
			tagSlug: string;
		} & UserTagFilmsHrefArgs
	)
	// /<userSlug>/friends/tag/<tagSlug>/films/
	| (
		{
			userSlug: string;
			friends: true;
			tagSlug: string;
		} & UserTagFilmsHrefArgs
	)
	// /<userSlug>/list/<listSlug>/
	| (
		{
			userSlug: string;
			listSlug: string;
		} & ListHrefArgs
	)
);

export const filmsHref = (opts: FilmsHrefOptions): string => {
	if((opts as {href:string}).href != null) {
		return (opts as {href:string}).href;
	}
	// create trailing href with filters
	let hrefFilters = stringifyHrefFilterProps(opts as HrefFilterProps);
	if(hrefFilters && !hrefFilters.endsWith('/')) {
		hrefFilters += '/';
	}
	// stringify different href cases
	const { userSlug, tagSlug, filmSlug, listSlug, watchlist, similar, friends, likes, detail, } = opts as {
		userSlug: (string | undefined),
		tagSlug: (string | undefined),
		filmSlug: (string | undefined),
		listSlug: (string | undefined),
		watchlist: (true | undefined),
		similar: (true | undefined),
		friends: (true | undefined),
		likes: (true | undefined),
		detail: (boolean | undefined),
	};
	if(userSlug != null) {
		if(listSlug != null) {
			return `/${userSlug}/list/${listSlug}/${detail ? 'detail/' : ''}${hrefFilters}`;
		} else if(tagSlug != null) {
			if(friends) {
				return `/${userSlug}/friends/tag/${tagSlug}/films/`;
			} else {
				return `/${userSlug}/tag/${tagSlug}/films/`;
			}
		} else {
			if(watchlist) {
				return `/${userSlug}/watchlist/${hrefFilters}`;
			} else if(likes) {
				return `/${userSlug}/likes/films/${hrefFilters}`;
			} else {
				return `/${userSlug}/films/${hrefFilters}`;
			}
		}
	} else if(filmSlug != null) {
		if(similar) {
			return `/film/${filmSlug}/similar`;
		} else {
			throw new Error("Cannot get films from a film href");
		}
	} else if(tagSlug != null) {
		return `/tag/${tagSlug}/films/${hrefFilters}`;
	} else {
		return `/films/${hrefFilters}`;
	}
};

export const filmsURL = (opts: FilmsHrefOptions): string => {
	return urlFromHref(filmsHref(opts));
};



// Similar Films

export type SimilarToFilmHrefOptions = (
	{href: string}
	| (
		({filmSlug: string}
			& SimilarToFilmHrefArgs)
	)
);

export const similarItemsHref = (opts: SimilarToFilmHrefOptions): string => {
	let href = filmHref(opts);
	if(!href.endsWith('/')) {
		href += '/';
	}
	href += 'similar/';
	let hrefFilters = stringifyHrefFilterProps(opts as HrefFilterProps);
	if(hrefFilters && !hrefFilters.endsWith('/')) {
		hrefFilters += '/';
	}
	href += hrefFilters;
	return href;
};

export const similarItemsURL = (options: SimilarToFilmHrefOptions): string => {
	return urlFromHref(similarItemsHref(options));
};



// Film List

export type FilmListHrefOptions = (
	{href: string}
	| (
		{
			userSlug: string;
			listSlug: string;
		} & ListHrefArgs
	)
);

export const filmListHref = (opts: FilmListHrefOptions): string => {
	if((opts as {href:string}).href != null) {
		return (opts as {href:string}).href;
	}
	// create trailing href with filters
	let hrefFilters = stringifyHrefFilterProps(opts as HrefFilterProps);
	if(hrefFilters && !hrefFilters.endsWith('/')) {
		hrefFilters += '/';
	}
	// stringify href
	const { userSlug, listSlug, detail, } = opts as {
		userSlug: (string | undefined),
		listSlug: (string | undefined),
		detail: (boolean | undefined),
	};
	return `/${userSlug}/list/${listSlug}/${detail ? 'detail/' : ''}${hrefFilters}`;
};

export const filmListURL = (opts: FilmListHrefOptions): string => {
	return urlFromHref(filmListHref(opts));
};
