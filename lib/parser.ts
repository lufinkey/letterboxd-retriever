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
	PageBackdrop,
	Pagination
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



// Film

export const parseFilmPage = (pageData: cheerio.CheerioAPI | string): FilmPageData => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	const body = $('body');
	const backdropTag = $('#backdrop');
	const posterTag = $('#poster-modal .film-poster');
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
	const yearString = $('section.production-masthead .productioninfo .releasedate').text()?.trim()
	let year: (number | undefined) = Number.parseInt(yearString)
	if (`${year}` != yearString) {
		year = undefined
	}
	return {
		id: posterTag.attr('data-film-id')!,
		slug: posterTag.attr('data-film-slug')!,
		type: body.attr('data-type') as any,
		name: $('section.production-masthead .primaryname .name').text()?.trim(),
		year: year!,
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



// General

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

export const parsePagination = ($: cheerio.CheerioAPI): Pagination => {
	return {
		prevPageHref: $('#content section .pagination a.previous').attr('href') ?? null,
		nextPageHref: $('#content section .pagination a.next').attr('href') ?? null,
	};
};



// Film Poster

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



// Viewing List

export const parseViewingListPage = (pageData: string): ReviewsPage => {
	const $ = cheerio.load(pageData);
	// find viewing list
	const viewingList = $('.viewing-list');
	if(viewingList.index() == -1) {
		// no viewing list, so make sure there is a "no reviews" block
		const uiBlockHeading = $('.ui-block-heading').text();
		if(!uiBlockHeading || !uiBlockHeading.toLowerCase().startsWith("no ")) {
			console.log("No viewing list element found");
		}
	}
	// parse viewing list items
	let viewings: Viewing[] = [];
	for(const viewingElement of viewingList.find('> .listitem')) {
		const viewing = parseViewingListElement($(viewingElement), $);
		viewings.push(viewing);
	}
	// parse pagination
	const pagination = parsePagination($);
	// return data
	return {
		items: viewings,
		...pagination,
	};
};

export const parseViewingListElement = (reviewTag: cheerio.Cheerio<Element>, $: cheerio.CheerioAPI): Viewing => {
	const avatarTag = reviewTag.find('a.avatar');
	const contextTag = reviewTag.find('.body a.context');
	const contextText = contextTag.text()?.trim().toLowerCase();
	const bodyTextTag = reviewTag.find('.body .body-text');
	const collapsedTextTag = bodyTextTag.find('.collapsed-text');
	const timestamp = reviewTag.find('time').attr("datetime");
	const viewingId = reviewTag.attr('data-viewing-id')
		?? reviewTag.find('*[data-likeable-uid]').attr('data-likeable-uid')?.split(':')[1];
	return {
		id: viewingId,
		user: {
			imageURL: parseCacheBusterURL(avatarTag.find('img').attr('src'), 'v'),
			href: avatarTag.attr('href')!,
			username: reviewTag.attr('data-person')!,
			displayName: contextTag.find('.displayname').text()!
		},
		href: contextTag.attr('href')!,
		rating: parseRatingString(reviewTag.find('.rating').text()),
		liked: reviewTag.find('.icon-liked').index() !== -1,
		text: (collapsedTextTag.index() != -1 ? collapsedTextTag.find('> p') : bodyTextTag.find('> p')).toArray().map((p) => $(p).text()).join("\n"),
		fullTextHref: bodyTextTag.attr('data-full-text-url'),
		hasMoreText: (bodyTextTag.index() != -1) ? (collapsedTextTag.index() !== -1) : undefined,
		date: timestamp!,
		isRewatch: (contextText ?
			(contextText.startsWith('rewatched') ? true
			: contextText.startsWith('watched') ? false
			: undefined)
			: undefined)
	};
};



// Activity

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
		if (node$.hasClass('no-activity-message')) {
			end = true;
			break;
		}
		let userDisplayName: string | undefined;
		let actionTypes: ActivityActionType[] | undefined;
		let film: Film | undefined = undefined;
		let viewing: Viewing | undefined = undefined;
		let filmList: FilmList | undefined = undefined;
		const timestamp = node$.find('time').attr('datetime');
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
			const userImageURL = parseCacheBusterURL(userImageSrc, 'v');
			userDisplayName = userImageElement.attr('alt');
			// parse activity entry
			const activityDescr = node$.find('.table-activity-description');
			const activityViewing = node$.find('.table-activity-viewing');
			const listSection = node$.find('section.list');
			if(activityDescr.index() !== -1) {
				const activitySummary = activityDescr.find('.activity-summary');
				// activity entry is a description
				const userLink = activitySummary.find('> a.name');
				if(userLink.index() === -1) {
					console.warn(`Missing user link on entry index ${entryIndex}`);
				}
				// check for multiple actions
				const multiActionTextTag = activitySummary.find('.context:not(:has(.rating)):not(:has(.name))');
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
					const ratingTag = activitySummary.find('.rating');
					let rating: number | undefined = undefined;
					if(ratingTag.index() !== -1) {
						const ratingStr = ratingTag.text().trim();
						rating = parseRatingString(ratingStr);
					}
					// parse viewer
					const viewerNameTag = activitySummary.find('a.name');
					const viewerName = viewerNameTag.text().trim();
					const viewerHref = viewerNameTag.attr('href');
					const viewerSlug = viewerHref ? trimString(viewerHref, '/').split('/')[0] : undefined;
					// parse viewing
					const viewingHref = activitySummary.find('a.target').attr('href');
					const viewingHrefParts = viewingHref ? trimString(viewingHref, '/').split('/') : [];
					const objType = viewingHrefParts[1];
					const filmSlug = viewingHrefParts[2];
					const isWatched = actionTypes.indexOf(ActivityActionType.Watched) != -1;
					const isRewatched = actionTypes.indexOf(ActivityActionType.Rewatched) != -1;
					// create objects
					viewing = {
						user: {
							href: viewerHref!,
							username: viewerSlug!,
							displayName: viewerName!
						},
						href: viewingHref!,
						rating: rating,
						date: (isWatched || isRewatched) ? timestamp : undefined,
						isRewatch: isRewatched ? true : isWatched ? false : undefined,
					};
					film = {
						name: filmName!,
						type: objType,
						slug: filmSlug!,
						href: (filmSlug ? `/${objType}/${filmSlug}/` : undefined)!
					};
				} else {
					// handle single action
					const objectLink = activitySummary.find('> a:nth-of-type(2)');
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
							const object2Link = activitySummary.find('> a:nth-of-type(3)');
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
								break;
							}
							console.warn(`Unknown object actions \"${afterObjectText}\" \"${object2Text}\" at index ${entryIndex}`);
						}
						break;

						case 'liked': {
							if(objectLink.index() === -1) {
								console.warn(`Missing object link on entry index ${entryIndex}`);
							}
							const objectLinkContext = objectLink.find('.context')[0]?.childNodes
								.map((n) => (n.type == 'text' ? $(n).text().trim() : undefined))
								.find((t) => t != null && t.length > 0)?.toLowerCase();
							if(objectLinkContext == 'review of') {
								// liked review
								let reviewerName = activitySummary.find('> strong.name').text();
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
									console.warn(`Review href ${reviewHref} didn't have expected structure for entry ${entryIndex}`);
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
								break;
							} else {
								const activitySummaryObj = activitySummary[0];
								const lastChildNode = (activitySummaryObj?.childNodes.length ?? 0) > 0 ? activitySummaryObj.childNodes[activitySummaryObj.childNodes.length-1] : undefined;
								if(lastChildNode?.nodeType == 3) { // check if node is child node
									const lastChildNodeText = $(lastChildNode).text()?.trim();
									if(lastChildNodeText === 'list') {
										// liked list
										const ownerName = activitySummary.find('> strong.name').text();
										const listHref = objectLink.attr('href')!
										let ownerHref: string;
										let ownerUsername: string;
										if(listHref && listHref.startsWith('/')) {
											const nextSlashIndex = listHref.indexOf('/', 1);
											if(nextSlashIndex != -1 && nextSlashIndex != (listHref.length-1)) {
												ownerUsername = listHref.substring(1, nextSlashIndex);
												ownerHref = `/${ownerUsername}/`;
											}
										}
										actionTypes = [ActivityActionType.LikedList];
										filmList = {
											href: listHref,
											name: objectLink.text(),
											owner: {
												href: ownerHref!,
												username: ownerUsername!,
												displayName: ownerName!,
											}
										};
										break;
									}
								}
							}
							console.warn(`Unknown object type ${objectLinkContext} at index ${entryIndex}`);
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
				const articleTag = activityViewing.find('> article');
				const viewingId = articleTag.attr('data-object-id')?.split(':')[1];
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
				const filmReviewLink = activityViewing.find('.body h2 > a');
				const filmReviewHref = filmReviewLink.attr('href');
				const filmReviewHrefParts = filmReviewHref ? trimString(filmReviewHref, '/').split('/') : [];
				const filmType = filmReviewHrefParts[1];
				const filmSlugFromViewing = filmReviewHrefParts[2];
				if(filmSlug && filmSlug != filmSlugFromViewing) {
					console.warn(`Viewing href ${filmReviewHref} didn't have expected structure for entry ${entryIndex}\n\tfilmSlug: ${filmSlug}\n\tfilmSlugFromViewing: ${filmSlugFromViewing}`);
				}
				const filmName = filmReviewLink.text();
				const filmYearLink = activityViewing.find('.body h2 > .metadata > a');
				const filmYear = filmYearLink.text().trim();
				const ratingTag = activityViewing.find('.body .rating');
				let rating: number | undefined = undefined;
				if(ratingTag.index() !== -1) {
					rating = parseRatingString(ratingTag.text());
				}
				const attributionTag = activityViewing.find('.body .attribution-detail');
				const viewerLink = attributionTag.find('> a');
				const viewerHref = viewerLink.attr('href');
				const viewerName = viewerLink.text();
				const viewerSlug = viewerHref ? trimString(viewerHref, '/').split('/')[0] : undefined;
				if(!viewerSlug) {
					console.warn(`Failed to parse username for entry ${entryIndex}`);
				} else if(viewerSlug.indexOf('/') != -1) {
					console.warn(`Parsed user slug ${viewerSlug} from href ${viewerHref} contains a slash on entry ${entryIndex}`);
				}
				const bodyTextTag = activityViewing.find('.body .body-text');
				const actionTypeStr = $(lastFromArray(attributionTag[0].childNodes)).text()?.trim().toLowerCase();
				actionTypes = [actionTypeStr as ActivityActionType];
				const isWatched = actionTypes.indexOf(ActivityActionType.Watched) != -1;
				const isRewatched = actionTypes.indexOf(ActivityActionType.Rewatched) != -1;
				viewing = {
					id: viewingId,
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
					fullTextHref: bodyTextTag.attr('data-full-text-url'),
					date: (isWatched || isRewatched) ? timestamp : undefined,
					isRewatch: isRewatched ? true : isWatched ? false : undefined,
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
				const activitySummary = node$.find('.activity-summary');
				const ownerObj = activitySummary.find('a.name');
				const ownerHref = ownerObj.attr('href');
				const ownerUsername = ownerHref ? trimString(ownerHref, '/').split('/')[0] : undefined;
				let ownerDisplayName = ownerObj.text();
				if(ownerDisplayName && (ownerDisplayName.endsWith("’s") || ownerDisplayName.endsWith("'s"))) {
					ownerDisplayName = ownerDisplayName.substring(0, ownerDisplayName.length-2);
				}
				const objectLink = activitySummary.find('a.target');
				const actionText = objectLink[0]?.previousSibling ? $(objectLink[0].previousSibling).text().trim().toLowerCase() : undefined;
				const filmCountStr = activitySummary.find('small.value').text();
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
					owner: {
						href: ownerHref!,
						username: ownerUsername!,
						displayName: ownerDisplayName
					},
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
					imageURL: userImageURL,
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
			/*console.error(JSON.stringify({
				userDisplayName,
				actionTypes,
				film,
				viewing,
				filmList
			}, null, '\t'));*/
			console.error(error);
		}
		entryIndex++;
	}
	return {
		items: feedItems,
		end: end
	};
};



// Films

export const parseFilmsPage = (pageData: cheerio.CheerioAPI | string): FilmsPage => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	// parse films
	const items: Film[] = [];
	const filmGridItems = $('ul.poster-list > li');
	for(const element of filmGridItems) {
		const film = parseFilmPosterContainer($(element));
		items.push(film);
	}
	// parse pagination
	const pagination = parsePagination($);
	return {
		items,
		...pagination,
	};
};

export const parseAjaxHrefFromFilmsPage = ($: cheerio.CheerioAPI): string | undefined => {
	// check if films page is loaded via ajax
	const filmsContainer = $('#films-browser-list-container');
	if(filmsContainer.index() == -1) {
		return undefined;
	}
	return filmsContainer.attr('data-url');
};



// Film List

export const parseFilmListPage = (pageData: cheerio.CheerioAPI | string): (FilmListPage | null) => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	const pageType = $('head meta[property="og:type"]').attr('content');
	// parse total items count
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
	// parse title
	const listTitleTag = $('.list-title-intro').first();
	let gotTitleFromTag = true;
	let title: (string | undefined) = listTitleTag.find('.title1').first().text();
	if(!title) {
		gotTitleFromTag = false;
		title = $('head meta[property="og:title"]').attr('content');
	}
	// parse description
	const descriptionTag = listTitleTag.find('.body-text:not(:has(.collapsed-text))').first();
	let descriptionText: (string | undefined) = (descriptionTag.index() != -1) ? descriptionTag.find('> p').toArray().map((item) => $(item).text()).join("\n") : undefined;
	if(descriptionText == null) {
		descriptionText = $('head meta[property="og:description"]').attr('content');
	}
	const descriptionHtml = descriptionTag.html() ?? undefined;
	// parse list properties
	const backdrop = $('#backdrop');
	const contentNav = $('#content-nav');
	const publishedAt = contentNav.find('.published time').attr('datetime');
	const updatedAt = contentNav.find('.updated time').attr('datetime');
	// get item list
	const posterList = $('ul.poster-list');
	const hasPosterList = posterList.index() != -1;
	let detailedList = !hasPosterList ? $('.list-detailed-entries-list') : null;
	let isViewingList = false;
	if(!hasPosterList && (!detailedList || detailedList.index() == -1)) {
		detailedList = $('.viewing-list');
		isViewingList = detailedList.index() != -1;
	}
	// parse items
	const items: FilmListItem[] = [];
	if(hasPosterList) {
		for(const element of posterList.find('> li')) {
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
			let ownerRating: number | string | undefined = (ownerRatingStr != null) ? Number.parseInt(ownerRatingStr) : undefined;
			if(ownerRating == null) {
				ownerRating = ownerRatingStr;
			}
			// add item
			items.push({
				id: (id ?? objectId)!,
				order: orderNum!,
				ownerRating: ownerRating as number,
				film: film
			});
		}
	} else if(detailedList && detailedList.index() != -1) {
		for(const element of detailedList.find('> .listitem')) {
			const elementTag = $(element);
			const film = parseFilmPosterContainer(elementTag);
			// parse order number
			let orderNumStr = elementTag.find('.list-number').text();
			if(orderNumStr.endsWith('.')) {
				orderNumStr = orderNumStr.substring(0, orderNumStr.length-1);
			}
			let orderNum: number | undefined = undefined;
			if(orderNumStr != null && orderNumStr.length > 0) {
				orderNum = Number.parseInt(orderNumStr);
				if(Number.isNaN(orderNum)) {
					console.error(`Failed to parse order number`);
					orderNum = undefined;
				}
			}
			// parse entry id
			const articleTag = elementTag.find('> article');
			const objectId = articleTag.attr('data-object-id');
			const objectIdParts = objectId?.split(':');
			const id = objectIdParts?.[1];
			// parse owner rating
			const ratingStr = elementTag.find('.rating').text()?.trim();
			const rating = parseRatingString(ratingStr);
			// parse notes text
			let hasMoreNotes: (boolean | undefined);
			const bodyTextTag = elementTag.find('.body-text').first();
			const hasBodyTextTag = bodyTextTag.index() != -1;
			const collapsedTextTag = bodyTextTag.find('> .collapsed-text');
			let notesTag = bodyTextTag;
			if(collapsedTextTag.index() != -1) {
				notesTag = collapsedTextTag;
				hasMoreNotes = true;
			} else if(hasBodyTextTag) {
				hasMoreNotes = false;
			}
			const fullNotesHref = hasBodyTextTag ? bodyTextTag.attr('data-full-text-url') : undefined;
			const bodyTextParts = notesTag.find('> p');
			const notesText = (bodyTextParts.length > 0) ?
				bodyTextParts.toArray().map((item) => $(item).text()).join("\n")
				: hasBodyTextTag ? notesTag.text() : undefined;
			const notesHtml = hasBodyTextTag ? (notesTag.html() ?? undefined) : undefined;
			// parse viewing properties if viewing list
			let viewingHref: (string | undefined) = undefined;
			let viewingDate: (string | undefined) = undefined;
			if(isViewingList) {
				const attributionBlock = elementTag.find('.attribution-block');
				viewingHref = attributionBlock.find('a.context').attr('href');
				const timeTag = attributionBlock.find('time');
				viewingDate = timeTag.attr('datetime');
			}
			// add item
			items.push({
				id: (id ?? objectId)!,
				order: orderNum!,
				ownerRating: rating as number,
				film: film,
				notesText,
				notesHtml,
				fullNotesHref,
				hasMoreNotes,
				viewingHref,
				viewingDate,
			});
		}
	} else {
		if((!title || !gotTitleFromTag) && !publishedAt && !updatedAt) {
			return null;
		}
		console.error("No film or viewing list found");
	}
	// parse pagination
	const pagination = parsePagination($);
	return {
		title: title!,
		descriptionText,
		descriptionHtml,
		items: items,
		totalCount,
		backdrop: backdrop.index() !== -1 ? parsePageBackdropTag(backdrop) : null,
		publishedAt: (publishedAt ? new Date(publishedAt) : undefined)!,
		updatedAt: (updatedAt ? new Date(updatedAt) : undefined)!,
		...pagination,
	};
};



// Error

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
