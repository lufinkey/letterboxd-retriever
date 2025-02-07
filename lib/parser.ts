import qs from 'querystring';
import urllib from 'url';
import * as cheerio from 'cheerio';
import { Element } from 'domhandler';
import {
	Film,
	Viewing,
	FilmList,
	FilmPageData,
	ActivityActionType,
	ActivityFeedEntry,
	ReviewsPage,
	TmdbMediaType,
	CastMember,
	CrewMember,
	RelatedFilmsList,
	FilmsPage,
	ErrorPage,
	FilmListItem,
	FilmListPage,
	PageBackdrop
} from './types';

const CSRF_TEXT_PREFIX = "supermodelCSRF = '";
const CSRF_TEXT_SUFFIX = "'";
const POSESSIVE_TEXT_SUFFIX1 = "’s";
const LDJSON_PREFIX = '/* <![CDATA[ */';
const LDJSON_SUFFIX = '/* ]]> */';

const crewRoleNameMap: {[key:string]:string} = {
	'Directors': 'Director',
	'Producers': 'Producer',
	'Writers': 'Writer',
	'Editors': 'Editor',
	'Executive Producers': 'Executive Producer',
	'Composers': 'Composer',
};

export const parsePageBackdropTag = (backdropTag: cheerio.Cheerio<any>): PageBackdrop => {
	return {
		default: parseCacheBusterURL(backdropTag.attr('data-backdrop'), 'v')!,
		retina: parseCacheBusterURL(backdropTag.attr('data-backdrop2x'), 'v')!,
		mobile: parseCacheBusterURL(backdropTag.attr('data-backdrop-mobile'), 'v')!
	};
};

export const parseFilmPage = (pageData: cheerio.CheerioAPI | string): FilmPageData => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	const body = $('body');
	const backdropTag = $('#backdrop');
	// parse reviews
	let popularReviews: Viewing[] = [];
	for(const reviewElement of $('ul.film-popular-review > li')) {
		const viewing = parseViewingListElement($(reviewElement), $);
		popularReviews.push(viewing);
	}
	// parse tmdb and imdb links
	const linksContainer = $('.text-link');
	const tmdbTag = linksContainer.find('a[data-track-action="TMDb" i]');
	const tmdbUrl = tmdbTag.attr('href');
	let tmdbUrlPathParts: string[] | undefined = undefined;
	if(tmdbUrl) {
		try {
			tmdbUrlPathParts = trimString((new urllib.URL(tmdbUrl)).pathname!, '/').split('/');
		} catch(error) {
			console.warn(error);
		}
	}
	const imdbTag = linksContainer.find('a[data-track-action="IMDb" i]');
	const imdbUrl = imdbTag.attr('href');
	let imdbUrlPathParts: string[] | undefined = undefined;
	if(imdbUrl) {
		try {
			imdbUrlPathParts = trimString((new urllib.URL(imdbUrl)).pathname!, '/').split('/');
		} catch(error) {
			console.warn(error);
		}
	}
	// parse cast
	const cast: CastMember[] = [];
	const castEntryTags = $('#tab-cast .cast-list a:not(#show-cast-overflow)');
	for(const castEntryElement of castEntryTags) {
		const castEntryTag = $(castEntryElement);
		const role = castEntryTag.attr('title');
		const personName = castEntryTag.text();
		if(!personName) {
			continue;
		}
		cast.push({
			href: castEntryTag.attr('href')!,
			name: personName,
			role: role!
		});
	}
	// parse crew
	const crew: CrewMember[] = [];
	const crewTitleTags = $('#tab-crew > h3:has(.crewrole)');
	for(const crewEntryTitleElement of crewTitleTags) {
		const crewEntryTitleTag = $(crewEntryTitleElement);
		let role = crewEntryTitleTag.find('.crewrole.-full').text() ?? crewEntryTitleTag.find('.crewrole').text();
		if(role in crewRoleNameMap) {
			role = crewRoleNameMap[role];
		}
		let nextElement = crewEntryTitleElement.nextSibling;
		while(nextElement && nextElement.nodeType != 1) {
			nextElement = nextElement.nextSibling;
		}
		nextElement = nextElement as Element;
		if(!nextElement || nextElement.name.toLowerCase() == 'h3') {
			continue;
		}
		const personList = $(nextElement).find('.text-sluglist a');
		for(const personElement of personList) {
			const personTag = $(personElement);
			const personName = personTag.text();
			if(!personName) {
				continue;
			}
			crew.push({
				href: personTag.attr('href')!,
				name: personName,
				role: role
			});
		}
	}
	// parse similar films
	let similarFilms: RelatedFilmsList | null = null;
	const similarFilmsContainer = $('section.related-films:not(#related)');
	if(similarFilmsContainer.index() != -1) {
		similarFilms = parseRelatedFilmsContainer(similarFilmsContainer, $);
	}
	// parse related films
	let relatedFilms: RelatedFilmsList | null = null;
	const relatedFilmsContainer = $('#related.related-films');
	if(relatedFilmsContainer.index() != -1) {
		relatedFilms = parseRelatedFilmsContainer(relatedFilmsContainer, $);
	}
	// create film info
	return {
		id: backdropTag.attr('data-film-id')!,
		slug: backdropTag.attr('data-film-slug')!,
		type: body.attr('data-type') as any,
		name: $('section.film-header-group .filmtitle').text()?.trim(),
		year: $('section.film-header-group .releaseyear').text()?.trim(),
		tagline: $('section .review.body-text .tagline').text(),
		description: $('section .review.body-text div > p').toArray().map((p) => $(p).text()).join("\n"),
		tmdb: tmdbUrl ? {
			url: tmdbUrl,
			id: (tmdbUrlPathParts ? tmdbUrlPathParts[1] : undefined)!,
			type: (tmdbUrlPathParts ? tmdbUrlPathParts[0] : undefined) as TmdbMediaType,
		} : undefined,
		imdb: imdbUrl ? {
			url: imdbUrl,
			id: (imdbUrlPathParts ? imdbUrlPathParts[1] : undefined)!
		} : undefined,
		backdrop: parsePageBackdropTag(backdropTag),
		cast: cast,
		crew: crew,
		similarFilms,
		relatedFilms,
		popularReviews: popularReviews
	};
};

export const parseRelatedFilmsContainer = (element: cheerio.Cheerio<Element>, $: cheerio.CheerioAPI): RelatedFilmsList => {
	const href = element.find('.section-heading a').attr('href');
	const title = element.find('.section-heading').text().trim();
	const hasMore = element.find('.more-link').index() != -1;
	const items: Film[] = [];
	for(const posterContainer of element.find('ul.poster-list > li')) {
		const film = parseFilmPosterContainer($(posterContainer));
		items.push(film);
	}
	return {
		href: href!,
		title: title!,
		hasMore: hasMore,
		items
	};
};

export const parseLdJson = (pageData: cheerio.CheerioAPI | string): any => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	const scriptTag = $('script[type="application/ld+json"]');
	let ldJsonString = scriptTag.text().trim();
	if(ldJsonString.startsWith(LDJSON_PREFIX)) {
		ldJsonString = ldJsonString.substring(LDJSON_PREFIX.length);
	}
	if(ldJsonString.endsWith(LDJSON_SUFFIX)) {
		ldJsonString = ldJsonString.substring(0, ldJsonString.length - LDJSON_SUFFIX.length);
	}
	if(!ldJsonString) {
		return null;
	}
	try {
		return JSON.parse(ldJsonString);
	} catch(error) {
		return eval(ldJsonString);
	}
};

export const parseCSRF = (pageData: cheerio.CheerioAPI | string) => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	for(const node of $('head script')) {
		const nodeText = $(node).text();
		let startIndex = 0;
		let csrfIndex;
		do {
			csrfIndex = nodeText.indexOf(CSRF_TEXT_PREFIX, startIndex);
			if(csrfIndex == -1) {
				break;
			}
			const csrfPartStart = csrfIndex + CSRF_TEXT_PREFIX.length;
			const csrfPartEnd = nodeText.indexOf(CSRF_TEXT_SUFFIX, csrfPartStart);
			if(csrfPartEnd != -1) {
				const csrf = nodeText.substring(csrfPartStart, csrfPartEnd);
				if(csrf.length > 0) {
					return csrf;
				}
			}
			startIndex = csrfPartStart;
		} while(true);
	}
	return null;
};

export const trimString = (str: string, char: string): string => {
	if(!str) {
		return str;
	}
	let start = 0;
	let end = str.length;
	while(start < str.length && str[start] == char) {
		start++;
	}
	while(end > start && str[end-1] == char) {
		end--;
	}
	return str.substring(start, end);
};

const countStringOccurences = (str: string, find: string): number => {
	let count = 0;
	let startIndex = 0;
	do {
		let foundIndex = str.indexOf(find, startIndex);
		if(foundIndex == -1) {
			return count;
		}
		count++;
		startIndex = foundIndex + find.length;
	} while(true);
	return count;
};

const lastFromArray = <T>(arr: T[]): T | undefined => {
	if(arr.length > 0) {
		return arr[arr.length-1];
	}
	return undefined;
};

const parseRatingString = (ratingStr: string | undefined): number | undefined => {
	if(!ratingStr) {
		return undefined;
	}
	return (2 * countStringOccurences(ratingStr, '★'))
		+ countStringOccurences(ratingStr, '½');
};

const createFilmPosterURL = (filmId: string, filmSlug: string, width: string | number, height: string | number): string => {
	return `https://a.ltrbxd.com/resized/film-poster/${filmId.split('').join('/')}/${filmId}-${filmSlug}-0-${width}-0-${height}-crop.jpg`;
};

const createFilmPosterURLScaled = (filmId: string, filmSlug: string, width: string | number, height: string | number, scale: number): string => {
	// parse width values
	let widthVal: number;
	if(typeof width === 'number') {
		widthVal = width;
	} else {
		widthVal = Number.parseInt(width);
	}
	let heightVal: number;
	if(typeof height === 'number') {
		heightVal = height;
	} else {
		heightVal = Number.parseInt(height);
	}
	// scale the image
	if(!Number.isNaN(widthVal) && !Number.isNaN(heightVal)) {
		widthVal *= scale;
		heightVal *= scale;
	} else {
		widthVal = width as any;
		heightVal = height as any;
	}
	return createFilmPosterURL(filmId, filmSlug, widthVal, heightVal);
};

const parseCacheBusterURL = (url: string | undefined, busterKey: string): string | undefined => {
	if(!url) {
		return url;
	}
	const queryIndex = url.indexOf('?');
	if(queryIndex == -1) {
		return url;
	}
	const query = qs.parse(url.substring(queryIndex+1));
	delete query[busterKey];
	let urlWithoutQuery = url.substring(0, queryIndex);
	let hasQueryEntry = false;
	for(const _ in query) {
		hasQueryEntry = true;
		break;
	}
	if(!hasQueryEntry) {
		return urlWithoutQuery;
	}
	return `${urlWithoutQuery}?${qs.stringify(query)}`;
};

export const parseFilmPosterPage = (pageData: string): Film => {
	const $ = cheerio.load(`<body id="root">${pageData}</body>`);
	return parseFilmPosterContainer($.root());
};

export const parseFilmPosterContainer = (element: cheerio.Cheerio<any>): Film => {
	const posterTag = element.find('.film-poster');
	return parseFilmPosterElement(posterTag);
};

export const parseFilmPosterElement = (posterTag: cheerio.Cheerio<any>): Film => {
	const imgTag = posterTag.find('img');
	let href = posterTag.attr('data-film-link') ?? posterTag.attr('data-target-link');
	if(href == '/') {
		href = undefined;
	}
	let type = posterTag.attr('data-type');
	let slug = posterTag.attr('data-film-slug');
	if(href) {
		if(!type || !slug) {
			const hrefParts = href ? trimString(href, '/').split('/') : [];
			if(!type) {
				type = hrefParts[0];
			}
			if(!slug) {
				slug = hrefParts[1];
			}
		}
	} else {
		if (type && slug) {
			href = `/${type}/${slug}/`;
		}
	}
	let year = posterTag.attr('data-film-release-year');
	if(!year) {
		const fullFilmTitle = posterTag.find('span[title]').attr('title');
		if(fullFilmTitle && fullFilmTitle.endsWith(')')) {
			const parenthStart = fullFilmTitle.lastIndexOf('(');
			if(parenthStart != -1) {
				year = fullFilmTitle.substring(parenthStart+1, fullFilmTitle.length-1);
			}
		}
	}
	return {
		id: posterTag.attr('data-film-id'),
		type: type ?? 'film',
		href: href!,
		imageURL: parseCacheBusterURL(imgTag.attr('src'), 'v'),
		slug: slug!,
		name: (posterTag.attr('data-film-name') ?? imgTag.attr('alt'))!,
		year: year
	};
};

export const parseViewingListPage = (pageData: string): ReviewsPage => {
	const $ = cheerio.load(pageData);
	let viewings: Viewing[] = [];
	for(const viewingElement of $('.viewings-list > ul > li')) {
		const viewing = parseViewingListElement($(viewingElement), $);
		viewings.push(viewing);
	}
	const nextPageURL = $('.viewings-list .pagination .paginate-nextprev a.next').attr('href');
	let nextPage: {href: string, page: number} | null;
	if(nextPageURL) {
		const pageParts = trimString(nextPageURL, '/').split('/');
		let pageNum = Number.parseInt(pageParts[pageParts.length-1]);
		nextPage = {
			href: nextPageURL,
			page: (!Number.isNaN(pageNum) ? pageNum : undefined)!
		};
	} else {
		nextPage = null;
	}
	return {
		items: viewings,
		nextPage: nextPage
	};
};

export const parseViewingListElement = (reviewTag: cheerio.Cheerio<Element>, $: cheerio.CheerioAPI): Viewing => {
	const avatarTag = reviewTag.find('a.avatar');
	const contextTag = reviewTag.find('.film-detail-content a.context');
	const bodyTextTag = reviewTag.find('.film-detail-content .body-text');
	const collapsedTextTag = bodyTextTag.find('.collapsed-text');
	return {
		id: reviewTag.attr('data-viewing-id'),
		user: {
			imageURL: parseCacheBusterURL(avatarTag.find('img').attr('src'), 'v'),
			href: avatarTag.attr('href')!,
			username: reviewTag.attr('data-person')!,
			displayName: contextTag.find('.name').text()!
		},
		href: contextTag.attr('href')!,
		rating: parseRatingString(reviewTag.find('.rating').text()),
		liked: reviewTag.find('.icon-liked').index() !== -1,
		text: (collapsedTextTag.index() != -1 ? collapsedTextTag.find('> p') : bodyTextTag.find('> p')).toArray().map((p) => $(p).text()).join("\n"),
		fullTextHref: bodyTextTag.attr('data-full-text-url'),
		hasMoreText: (bodyTextTag.index() != -1) ? (collapsedTextTag.index() !== -1) : undefined
	};
};

export const parseAjaxActivityFeed = (pageData: string): { items: ActivityFeedEntry[], end: boolean } => {
	const $ = cheerio.load(`<body id="root">${pageData}</body>`);
	const feedItems: ActivityFeedEntry[] = [];
	let end = false;
	let entryIndex = 0;
	for(const node of $('body#root > section')) {
		const node$ = $(node);
		const endMarker = node$.find('.end-of-activity');
		if(endMarker.index() !== -1) {
			end = true;
			break;
		}
		try {
			// parse user info
			const userHref = node$.find('.table-activity-user > a').attr('href');
			const username = userHref ? trimString(userHref, '/') : undefined;
			if(!username) {
				console.warn(`Failed to parse username for entry ${entryIndex}`);
			}
			else if(username.indexOf('/') != -1) {
				console.warn(`Parsed user slug ${username} from href ${userHref} contains a slash on entry ${entryIndex}`);
			}
			const userImageElement = node$.find(".table-activity-user");
			const userImageSrc = userImageElement.attr('src');
			let userDisplayName = userImageElement.attr('alt');
			// parse activity entry
			let actionTypes: ActivityActionType[];
			let film: Film | undefined = undefined;
			let viewing: Viewing | undefined = undefined;
			let filmList: FilmList | undefined = undefined;
			const activityDescr = node$.find('.table-activity-description');
			const activityViewing = node$.find('.table-activity-viewing');
			const listSection = node$.find('section.list');
			if(activityDescr.index() !== -1) {
				// activity entry is a description
				const userLink = activityDescr.find('.activity-summary > a.name');
				if(userLink.index() === -1) {
					console.warn(`Missing user link on entry index ${entryIndex}`);
				}
				// check for multiple actions
				const multiActionTextTag = activityDescr.find('.activity-summary .context:not(:has(.rating)):not(:has(.name))');
				const multiActionText = multiActionTextTag.index() !== -1 ? multiActionTextTag.text().trim() : null;
				if(multiActionText) {
					// handle multi-action
					const parts = multiActionText.split(/,|and/)
						.map((item) => item.trim())
						.filter((item) => item);
					actionTypes = parts as ActivityActionType[];
					// parse movie name
					const filmName = multiActionTextTag[0]?.nextSibling ? $(multiActionTextTag[0].nextSibling).text().trim() : undefined;
					// parse rating
					const ratingTag = activityDescr.find('.activity-summary .rating');
					let rating: number | undefined = undefined;
					if(ratingTag.index() !== -1) {
						const ratingStr = ratingTag.text().trim();
						rating = parseRatingString(ratingStr);
					}
					// parse viewer
					const viewerNameTag = activityDescr.find('.activity-summary a.name');
					const viewerName = viewerNameTag.text().trim();
					const viewerHref = viewerNameTag.attr('href');
					const viewerSlug = viewerHref ? trimString(viewerHref, '/').split('/')[0] : undefined;
					// parse viewing
					const viewingHref = activityDescr.find('.activity-summary a.target').attr('href');
					const viewingHrefParts = viewingHref ? trimString(viewingHref, '/').split('/') : [];
					const objType = viewingHrefParts[1];
					const filmSlug = viewingHrefParts[2];
					// create objects
					viewing = {
						user: {
							href: viewerHref!,
							username: viewerSlug!,
							displayName: viewerName!
						},
						href: viewingHref!,
						rating: rating
					};
					film = {
						name: filmName!,
						type: objType,
						slug: filmSlug!,
						href: (filmSlug ? `/${objType}/${filmSlug}/` : undefined)!
					};
				} else {
					// handle single action
					const objectLink = activityDescr.find('.activity-summary > a:nth-of-type(2)');
					const userLinkText = userLink.text().trim();
					if(userLinkText) {
						userDisplayName = userLinkText;
					}
					const actionText = userLink[0]?.nextSibling ? $(userLink[0].nextSibling).text().trim().toLowerCase() : undefined;
					switch(actionText) {
						case 'added': {
							if(objectLink.index() === -1) {
								console.warn(`Missing object link on entry index ${entryIndex}`);
							}
							const afterObjectText = objectLink[0]?.nextSibling ? $(objectLink[0].nextSibling).text().trim().toLowerCase() : undefined;
							const object2Link = activityDescr.find('.activity-summary > a:nth-of-type(3)');
							const object2Text = object2Link.text().trim().toLowerCase();
							if(afterObjectText == 'to' && object2Text.endsWith(' watchlist')) {
								// added to watchlist
								actionTypes = [ActivityActionType.AddedToWatchlist];
								const filmHref = objectLink.attr('href');
								const filmHrefParts = filmHref ? trimString(filmHref, '/').split('/') : [];
								film = {
									href: filmHref!,
									type: filmHrefParts[0] ?? 'film',
									slug: filmHrefParts[1]!,
									name: objectLink.text()
								};
							}
						}
						break;

						case 'liked': {
							if(objectLink.index() === -1) {
								console.warn(`Missing object link on entry index ${entryIndex}`);
							}
							const objectLinkContext = objectLink.find('.context')[0].childNodes
								.map((n) => (n.type == 'text' ? $(n).text().trim() : undefined))
								.find((t) => t != null && t.length > 0)?.toLowerCase();
							if(objectLinkContext == 'review of') {
								// liked review
								let reviewerName = activityDescr.find('.activity-summary > strong.name').text();
								if(reviewerName.endsWith(POSESSIVE_TEXT_SUFFIX1)) {
									reviewerName = reviewerName.substring(0, reviewerName.length - POSESSIVE_TEXT_SUFFIX1.length);
								}
								const ratingTag = objectLink.find('.rating');
								let rating: number | undefined = undefined;
								if(ratingTag.index() !== -1) {
									const ratingStr = ratingTag.text().trim();
									rating = parseRatingString(ratingStr);
								}
								const reviewHref = objectLink.attr('href');
								const reviewHrefParts = reviewHref ? trimString(reviewHref, '/').split('/') : [];
								const filmType = reviewHrefParts[1];
								const filmSlug = reviewHrefParts[2];
								if(!filmSlug) {
									console.warn(`Review href ${reviewHref} didn't have expected structure`);
								}
								const reviewerSlug = reviewHrefParts[0];
								const filmName = $(lastFromArray(objectLink[0].childNodes)).text().trim();
								actionTypes = [ActivityActionType.LikedReview];
								viewing = {
									user: {
										href: (reviewerSlug ? `/${reviewerSlug}/` : undefined)!,
										displayName: reviewerName,
										username: reviewerSlug
									},
									href: reviewHref!,
									rating: rating
								};
								film = {
									name: filmName,
									type: filmType,
									slug: filmSlug,
									href: (filmSlug ? `/${filmType}/${filmSlug}/` : undefined)!
								};
							} else {
								console.warn(`Unknown object type ${objectLinkContext} at index ${entryIndex}`);
							}
						}
						break;

						default:
							console.warn(`Unknown action ${actionText} on entry ${entryIndex}`);
							break;
					}
				}
			}
			else if(activityViewing.index() !== -1) {
				// viewing
				const filmPosterTag = activityViewing.find('.film-poster');
				const filmId = filmPosterTag.attr('data-film-id');
				const filmSlug = filmPosterTag.attr('data-film-slug');
				/*let filmPosterImageURL: string | undefined = undefined;
				if(filmId && filmSlug) {
					const posterImgTag = filmPosterTag.find('img');
					if(posterImgTag.index() !== -1) {
						const width = posterImgTag.attr('width');
						const height = posterImgTag.attr('height');
						if(width && height) {
							filmPosterImageURL = createFilmPosterURLScaled(filmId, filmSlug, width, height, 2);
						}
					}
				}*/
				const filmReviewLink = activityViewing.find('.film-detail-content > h2 > a');
				const filmReviewHref = filmReviewLink.attr('href');
				const filmReviewHrefParts = filmReviewHref ? trimString(filmReviewHref, '/').split('/') : [];
				const filmType = filmReviewHrefParts[1];
				const filmSlugFromViewing = filmReviewHrefParts[2];
				if(filmSlug && filmSlug != filmSlugFromViewing) {
					console.warn(`Review href ${filmReviewHref} didn't have expected structure`);
				}
				const filmName = filmReviewLink.text();
				const filmYearLink = activityViewing.find('.film-detail-content > h2 > small.metadata > a');
				const filmYear = filmYearLink.text().trim();
				const ratingTag = activityViewing.find('.film-detail-content > .film-detail-meta > .rating');
				let rating: number | undefined = undefined;
				if(ratingTag.index() !== -1) {
					rating = parseRatingString(ratingTag.text());
				}
				const contextTag = activityViewing.find('.film-detail-content .attribution > .context');
				const viewerLink = contextTag.children('a');
				const viewerHref = viewerLink.attr('href');
				const viewerName = viewerLink.text();
				const viewerSlug = viewerHref ? trimString(viewerHref, '/').split('/')[0] : undefined;
				if(!viewerSlug) {
					console.warn(`Failed to parse username for entry ${entryIndex}`);
				} else if(viewerSlug.indexOf('/') != -1) {
					console.warn(`Parsed user slug ${viewerSlug} from href ${viewerHref} contains a slash on entry ${entryIndex}`);
				}
				const bodyTextTag = activityViewing.find('.film-detail-content .body-text');
				const actionTypeStr = $(lastFromArray(contextTag[0].childNodes)).text()?.trim().toLowerCase();
				actionTypes = [actionTypeStr as ActivityActionType];
				viewing = {
					user: {
						imageURL: parseCacheBusterURL(userImageSrc, 'v'),
						href: viewerHref!,
						username: viewerSlug!,
						displayName: viewerName
					},
					href: filmReviewHref!,
					rating: rating,
					liked: activityViewing.find('.icon-liked').index() !== -1,
					text: bodyTextTag.find('> p').toArray().map((p) => $(p).text()).join("\n"),
					fullTextHref: bodyTextTag.attr('data-full-text-url')
				};
				film = {
					id: filmId,
					type: filmType,
					name: filmName,
					href: (filmSlugFromViewing ? `/${filmType}/${filmSlugFromViewing}/` : undefined)!,
					slug: filmSlug ?? filmSlugFromViewing,
					year: filmYear
				};
			} else if(listSection.index() != -1) {
				// film list
				const objectLink = node$.find('.activity-summary a.target');
				const actionText = objectLink[0]?.previousSibling ? $(objectLink[0].previousSibling).text().trim().toLowerCase() : undefined;
				const filmCountStr = node$.find('.activity-summary small.value').text();
				let totalFilmCount: number | undefined = undefined;
				if(filmCountStr) {
					let startIndex = 0;
					while(startIndex < filmCountStr.length && !'0123456789'.includes(filmCountStr[startIndex])) {
						startIndex++;
					}
					if(startIndex < filmCountStr.length) {
						let endIndex = startIndex+1;
						while(endIndex < filmCountStr.length && '0123456789'.includes(filmCountStr[endIndex])) {
							endIndex++;
						}
						const countStr = filmCountStr.substring(startIndex, endIndex);
						totalFilmCount = Number.parseInt(countStr);
						if(Number.isNaN(countStr)) {
							totalFilmCount = undefined;
						}
					}
				}
				const films: Film[] = [];
				for(const filmElement of listSection.find('ul.poster-list > li')) {
					const film = parseFilmPosterElement($(filmElement));
					if(!film.id && !film.name && !film.href && !film.slug && !film.year) {
						break;
					}
					films.push(film);
				}
				actionTypes = [actionText as ActivityActionType];
				filmList = {
					id: listSection.attr('data-film-list-id'),
					href: listSection.find('a.list-link').attr('href')!,
					name: objectLink.text(),
					films: films,
					totalCount: totalFilmCount
				};
			} else {
				console.warn(`Unknown feed item at index ${entryIndex}`);
				// TODO handle other types of feed items
			}
			// parse other item properties
			const id = node$.attr('data-activity-id');
			const dateStr = node$.children('time').attr('datetime');
			const time = dateStr ? new Date(dateStr) : undefined;
			// add entry
			feedItems.push({
				id: id!,
				user: {
					imageURL: parseCacheBusterURL(userImageSrc, 'v'),
					href: userHref!,
					username: username!,
					displayName: userDisplayName!
				},
				actions: actionTypes!,
				film: film,
				filmList: filmList,
				viewing: viewing,
				time: time!
			});
		} catch(error) {
			console.error(`Failed to parse entry ${entryIndex}`);
			console.error(error);
		}
		entryIndex++;
	}
	return {
		items: feedItems,
		end: end
	};
};


export const parseFilmsPage = (pageData: cheerio.CheerioAPI | string): FilmsPage => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	const items: Film[] = [];
	const filmGridItems = $('ul.poster-list.film-list > li');
	for(const element of filmGridItems) {
		const film = parseFilmPosterContainer($(element));
		items.push(film);
	}
	return {items};
};

export const parseFilmListPage = (pageData: cheerio.CheerioAPI | string): FilmListPage => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	const pageType = $('head meta[property="og:type"]').attr('content');
	const items: FilmListItem[] = [];
	const filmGridItems = $('ul.poster-list.film-list > li');
	for(const element of filmGridItems) {
		const elementTag = $(element);
		const film = parseFilmPosterContainer(elementTag);
		// parse order number
		const orderNumStr = elementTag.find('.list-number').text();
		let orderNum: number | undefined = undefined;
		if(orderNumStr != null && orderNumStr.length > 0) {
			orderNum = Number.parseInt(orderNumStr);
			if(Number.isNaN(orderNum)) {
				orderNum = undefined;
			}
		}
		// parse entry id
		const objectId = elementTag.attr('data-object-id');
		const objectIdParts = objectId?.split(':');
		const id = objectIdParts ? objectIdParts[1] : undefined;
		// parse owner rating
		const ownerRatingStr = elementTag.attr('data-owner-rating');
		let ownerRating: number | string | undefined = ownerRatingStr != null ? Number.parseInt(ownerRatingStr) : undefined;
		if(ownerRating == null) {
			ownerRating = ownerRatingStr;
		}
		items.push({
			id: (id ?? objectId)!,
			order: orderNum!,
			ownerRating: ownerRating as number,
			film: film
		});
	}
	let totalCount: number | undefined = undefined;
	if(pageType == 'letterboxd:list') {
		const pageDescr = $('head meta[name="description"]').attr('content');
		const prefix = 'A list of ';
		if(pageDescr?.startsWith(prefix)) {
			let nextWhitespaceIndex = pageDescr.indexOf(' ', prefix.length);
			if(nextWhitespaceIndex == -1) {
				nextWhitespaceIndex = pageDescr.length;
			}
			totalCount = Number.parseInt(pageDescr.substring(prefix.length, nextWhitespaceIndex));
			if(Number.isNaN(totalCount)) {
				totalCount = undefined;
			}
		}
	}
	const backdrop = $('#backdrop');
	const contentNav = $('#content-nav');
	const publishedAt = contentNav.find('.published time').attr('datetime');
	const updatedAt = contentNav.find('.updated time').attr('datetime');
	return {
		items: items,
		prevPageHref: $('#content section .pagination a.previous').attr('href') ?? null,
		nextPageHref: $('#content section .pagination a.next').attr('href') ?? null,
		totalCount,
		backdrop: backdrop.index() !== -1 ? parsePageBackdropTag(backdrop) : null,
		publishedAt: (publishedAt ? new Date(publishedAt) : undefined)!,
		updatedAt: (updatedAt ? new Date(updatedAt) : undefined)!
	};
};


export const parseErrorPage = (pageData: cheerio.CheerioAPI | string): ErrorPage => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	const bodyText = $('#content .body-text');
	return {
		title: bodyText.find('.title').text(),
		description: bodyText.find('p.text').text()
	};
};
