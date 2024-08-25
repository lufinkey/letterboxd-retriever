import qs from 'querystring';
import * as cheerio from 'cheerio';
import {
	DataNode
} from 'domhandler';
import {
	Film,
	Viewing,
	FilmPageData,
	ActivityActionType,
	ActivityFeedEntry,
	ActivityFeedPage
} from './types';

const CSRF_TEXT_PREFIX = "supermodelCSRF = '";
const CSRF_TEXT_SUFFIX = "'";
const POSESSIVE_TEXT_SUFFIX1 = "’s";
const LDJSON_PREFIX = '/* <![CDATA[ */';
const LDJSON_SUFFIX = '/* ]]> */';

export const parseFilmPage = (pageData: cheerio.CheerioAPI | string): FilmPageData => {
	let $: cheerio.CheerioAPI;
	if(typeof(pageData) === 'string') {
		$ = cheerio.load(pageData);
	} else {
		$ = pageData;
	}
	const body = $('body');
	const backdropTag = $('#backdrop');
	let popularReviews: Viewing[] = [];
	for(const reviewElement of $('ul.film-popular-review > li')) {
		const reviewTag = $(reviewElement);
		const avatarTag = reviewTag.find('a.avatar');
		const contextTag = reviewTag.find('.film-detail-content a.context');
		const bodyTextTag = reviewTag.find('.film-detail-content .body-text');
		const collapsedTextTag = bodyTextTag.find('.collapsed-text');
		popularReviews.push({
			id: reviewTag.attr('data-viewing-id'),
			user: {
				imageURL: avatarTag.find('img').attr('src'),
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
		});
	}
	return {
		id: backdropTag.attr('data-film-id')!,
		slug: backdropTag.attr('data-film-slug')!,
		type: body.attr('data-type') as any,
		tagline: $('section .review.body-text .tagline').text(),
		description: $('section .review.body-text div > p').toArray().map((p) => $(p).text()).join("\n"),
		tmdb: {
			id: body.attr('data-tmdb-id')!,
			type: body.attr('data-tmdb-type') as any
		},
		backdrop: {
			default: backdropTag.attr('data-backdrop')!,
			retina: backdropTag.attr('data-backdrop2x')!,
			mobile: backdropTag.attr('data-backdrop-mobile')!
		},
		popularReviews: popularReviews
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

const trimString = (str: string, char: string): string => {
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
	if(Object.keys(query).length == 0) {
		return urlWithoutQuery;
	}
	return `${urlWithoutQuery}?${qs.stringify(query)}`;
};

export const parsePosterPage = (pageData: string): Film => {
	const $ = cheerio.load(`<body id="root">${pageData}</body>`);
	const posterTag = $('.film-poster');
	const imgTag = posterTag.find('img');
	return {
		id: posterTag.attr('data-film-id'),
		imageURL: parseCacheBusterURL(imgTag.attr('src'), 'v'),
		href: posterTag.attr('data-film-link')!,
		slug: posterTag.attr('data-film-slug')!,
		name: posterTag.attr('data-film-name')!,
		year: posterTag.attr('data-film-release-year')
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
			const activityDescr = node$.find('.table-activity-description');
			const activityViewing = node$.find('.table-activity-viewing');
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
						slug: filmSlug!,
						href: (filmSlug ? `${objType}/${filmSlug}` : undefined)!
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
								const filmSlug = filmHref ? trimString(filmHref, '/').split('/')[1] : undefined;
								film = {
									name: objectLink.text(),
									slug: filmSlug!,
									href: filmHref!
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
								const filmName = $(lastFromArray(objectLink[0].childNodes)).text();
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
									slug: filmSlug,
									href: (filmSlug ? `/${filmType}/${filmSlug}/` : undefined)!
								};
							} else {
								console.warn(`Unknown object type at index ${entryIndex}`);
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
						imageURL: userImageSrc,
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
					name: filmName,
					href: (filmSlugFromViewing ? `/${filmType}/${filmSlugFromViewing}/` : undefined)!,
					slug: filmSlug ?? filmSlugFromViewing,
					year: filmYear
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
					imageURL: userImageSrc,
					href: userHref!,
					username: username!,
					displayName: userDisplayName!
				},
				actions: actionTypes!,
				film: film,
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
