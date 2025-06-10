import { HOST } from './constants';
import {
	AnyGenreSlug,
	FilmHrefSubroute,
	FilmHrefSubroutesSet,
	FirstYearInReview,
	GenreFilter,
	GenreSlugArray,
	HQMembersOrganizationType,
	HrefBaseMediaPageSlug,
	HrefFilterProps,
	HrefFilterSlug,
	HrefFilterSlugs,
	hrefFilterSlugToKey,
	HrefParts,
	MembersType,
	OtherPageSlug,
	OtherPageSlugs,
	PopularFilter,
	PopularFilterProps,
	PopularType,
	PopularTimeSpan,
	RoleFilter,
	RoleSlug,
	SearchTypeSlug,
	TagsType,
	TagsTypesSet,
	UserActivityType,
	UserActivityTypesSet,
	UserFilmLikesTypeSet,
	UserFilmsHrefSubroutesSet,
	UserFilmSubroute,
	UserFilmSubroutesSet,
	UserFilmViewingSubroutesSet,
	UserFriendsFilmSubroutesSet,
	UserHrefBaseSlug,
	UserLikesType,
	UserLikesTypesSet,
	PopularGroup,
} from './types/href';


export class HrefParseError extends Error {
	hrefPieces: string[];
	pieceIndex: number;
	errorOffset: number;
	reason: string;

	constructor(hrefPieces: string[], pieceIndex: number, errorOffset: number, reason: string) {
		super(`Failed to parse href piece ${JSON.stringify(hrefPieces.slice(pieceIndex, (pieceIndex+errorOffset+1)))}: ${reason}`);
		this.hrefPieces = hrefPieces;
		this.pieceIndex = pieceIndex;
		this.errorOffset = errorOffset;
		this.reason = reason;
	}
}


type IndexRef = {index:number};

const parseHrefPopularFilterValuePieces = (
	hrefPieces: string[],
	indexRef: IndexRef,
	offset: number,
): PopularFilter => {
	const type = hrefPieces[indexRef.index+offset];
	switch(type) {
		case PopularType.This: {
			const value = hrefPieces[indexRef.index+offset+1];
			switch(value) {
				case PopularTimeSpan.Year:
				case PopularTimeSpan.Month:
				case PopularTimeSpan.Week: {
					indexRef.index += (offset + 2);
					return {
						type,
						value,
					};
				}

				default:
					throw new HrefParseError(
						hrefPieces,
						indexRef.index,
						offset + 1,
						"Invalid popular time span"
					);
			}
		}

		case PopularType.With: {
			const value = hrefPieces[indexRef.index+offset+1];
			switch(value) {
				case PopularGroup.Friends: {
					indexRef.index += (offset + 2);
					return {
						type,
						value,
					};
				}

				default:
					throw new HrefParseError(
						hrefPieces,
						indexRef.index,
						offset + 1,
						"Invalid popular time span"
					);
			}
		}

		default: {
			indexRef.index += offset;
			return true;
		}
	}
	throw new Error("Invalid popular in href");
};

const parseHrefRoleFilterValuePieces = (
	hrefPieces: string[],
	indexRef: IndexRef,
	offset: number,
): RoleFilter => {
	const roleSlug = hrefPieces[indexRef.index+offset];
	if(roleSlug === undefined) {
		throw new HrefParseError(
			hrefPieces,
			indexRef.index,
			offset,
			"Missing role slug"
		);
	}
	const personSlug = hrefPieces[indexRef.index+offset+1];
	if(personSlug === undefined) {
		throw new HrefParseError(
			hrefPieces,
			indexRef.index,
			offset+1,
			"Missing person slug for role"
		);
	}
	indexRef.index += 2;
	return {
		roleSlug: roleSlug as RoleSlug,
		personSlug
	};
};

const parseHrefGenreFilterValue = (
	hrefPieces: string[],
	indexRef: IndexRef,
	offset: number,
): GenreSlugArray => {
	const genres: GenreSlugArray = [];
	const genreSlug = hrefPieces[indexRef.index+offset];
	let startIndex = 0;
	let substringStartIndex = 0;
	if(genreSlug.startsWith('+')) {
		substringStartIndex += 1;
	}
	for(let i=substringStartIndex; i<genreSlug.length; i++) {
		const c = genreSlug[i];
		if(c == '+') {
			genres.push(genreSlug.substring(substringStartIndex, i) as AnyGenreSlug);
			startIndex = i;
			substringStartIndex = (i+1);
		}
	}
	if(substringStartIndex < genreSlug.length) {
		genres.push(genreSlug.substring(startIndex, genreSlug.length) as AnyGenreSlug);
	}
	return genres;
}

const stringifyGenreFilterValue = (genre: GenreFilter): string => {
	if(genre instanceof Array) {
		return genre.map((g) => (g.startsWith('+') ? g.substring(1) : g)).join('+');
	} else {
		return genre;
	}
};

const parseHrefFilterProps = (
	hrefParts: HrefFilterProps,
	hrefPieces: string[],
	indexRef: IndexRef,
) => {
	while(indexRef.index < hrefPieces.length) {
		const piece = hrefPieces[indexRef.index];
		switch(piece) {
			case HrefFilterSlug.For:
			case HrefFilterSlug.Rated:
			case HrefFilterSlug.Decade:
			case HrefFilterSlug.Year:
			case HrefFilterSlug.Like:
			case HrefFilterSlug.In:
			case HrefFilterSlug.Nanogenre:
			case HrefFilterSlug.Theme:
			case HrefFilterSlug.MiniTheme:
			case HrefFilterSlug.On:
			case HrefFilterSlug.By:
			case HrefFilterSlug.Size:
			case HrefFilterSlug.Page: {
				const pieceValue = hrefPieces[indexRef.index+1];
				if(pieceValue === undefined) {
					throw new HrefParseError(
						hrefPieces,
						indexRef.index,
						1,
						`Missing value for filter ${piece}`
					);
				}
				(hrefParts as any)[hrefFilterSlugToKey(piece)] = pieceValue as any;
				indexRef.index += 2;
			} break;
			case HrefFilterSlug.Upcoming: {
				(hrefParts as {upcoming?:true}).upcoming = true;
				indexRef.index += 1;
			} break;
			case HrefFilterSlug.Popular: {
				(hrefParts as {popular?: PopularFilter}).popular = parseHrefPopularFilterValuePieces(hrefPieces, indexRef, 1);
			} break;
			case HrefFilterSlug.Genre: {
				hrefParts.genre = parseHrefGenreFilterValue(hrefPieces, indexRef, 1);
			} break;
			case HrefFilterSlug.With: {
				(hrefParts as {with?: RoleFilter}).with = parseHrefRoleFilterValuePieces(hrefPieces, indexRef, 1);
			} break;
			default:
				throw new HrefParseError(
					hrefPieces,
					indexRef.index,
					0,
					`Unknown href filter`
				);
		}
	}
};

export const stringifyHrefFilterProps = (hrefParts: HrefFilterProps): string => {
	const hrefPieces: string[] = [];
	for(const slug of HrefFilterSlugs) {
		const key = hrefFilterSlugToKey(slug);
		const val = (hrefParts as any)[key];
		if(val != null) {
			switch(slug) {
				case HrefFilterSlug.For:
				case HrefFilterSlug.Rated:
				case HrefFilterSlug.Decade:
				case HrefFilterSlug.Year:
				case HrefFilterSlug.Like:
				case HrefFilterSlug.In:
				case HrefFilterSlug.Nanogenre:
				case HrefFilterSlug.Theme:
				case HrefFilterSlug.MiniTheme:
				case HrefFilterSlug.On:
				case HrefFilterSlug.By:
				case HrefFilterSlug.Size:
				case HrefFilterSlug.Page: {
					hrefPieces.push(slug, val);
				} break;
				case HrefFilterSlug.Upcoming: {
					hrefPieces.push(slug);
				} break;
				case HrefFilterSlug.Popular: {
					if(val) {
						hrefPieces.push(slug);
						if(typeof val !== 'boolean') {
							const popular = (val as PopularFilterProps);
							hrefPieces.push(popular.type, popular.value);
						}
					}
				} break;
				case HrefFilterSlug.Genre: {
					hrefPieces.push(slug, stringifyGenreFilterValue(val));
				} break;
				case HrefFilterSlug.With: {
					const role = val as RoleFilter;
					hrefPieces.push(
						slug,
						role.roleSlug,
						role.personSlug,
					);
				} break;
				default:
					throw new Error(`I didn't define how to stringify ${slug}! whoops!`)
			}
		}
	}
	return hrefPieces.join('/');
};

export const parseHref = (href: string): HrefParts => {
	// parse out url prefix if needed
	let schemeIndex = href.indexOf('://');
	if(schemeIndex != -1) {
		let slashIndex = href.indexOf('/', schemeIndex+3);
		if(slashIndex != -1) {
			// ensure the url is a letterboxd url
			const host = href.substring(schemeIndex+3, slashIndex);
			if(host.toLowerCase() != HOST) {
				throw new Error(`Invalid url host ${host}`);
			}
			href = href.substring(slashIndex);
		} else {
			throw new Error("Invalid film list URL");
		}
	}
	// ensure href is a real href
	if(!href.startsWith('/')) {
		throw new Error("Invalid href");
	}
	// if href is root, just return
	if(href.length <= 1) {
		return {root:true};
	}
	// parse href parts
	let endIndex = href.length;
	let trailingSlash = false;
	if(href.endsWith('/')) {
		endIndex--;
		trailingSlash = true;
	}
	const hrefPieces = href.substring(1, endIndex).split('/');
	const base = hrefPieces[0];
	// handle other page types
	if(OtherPageSlugs.indexOf(base as any) != -1) {
		return {
			base: base as OtherPageSlug,
			remainingHref: hrefPieces.length > 1 ? (hrefPieces.slice(1).join('/') + (trailingSlash ? '/' : '')) : undefined,
		};
	}
	let hrefParts: HrefParts;
	// TODO handle year in review
	// handle different page types
	switch(base) {
		case HrefBaseMediaPageSlug.Film: {
			const indexRef = {index:0};
			const filmSlug = hrefPieces[1];
			if(filmSlug === undefined) {
				throw new HrefParseError(
					hrefPieces,
					indexRef.index,
					1,
					"Missing film slug"
				);
			}
			indexRef.index += 2;
			hrefParts = {
				base,
				filmSlug,
			};
			const subroute = hrefPieces[indexRef.index];
			if(subroute === undefined) {
				return hrefParts;
			} else if(!FilmHrefSubroutesSet.has(subroute as any)) {
				throw new HrefParseError(
					hrefPieces,
					indexRef.index,
					0,
					"Unknown film subroute"
				);
			}
			(hrefParts as {subroute?: FilmHrefSubroute}).subroute = subroute as FilmHrefSubroute;
			indexRef.index += 1;
			parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
			return hrefParts;
		}
		case HrefBaseMediaPageSlug.Films: {
			const indexRef = {index:1};
			hrefParts = {
				base,
			};
			parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
			return hrefParts;
		}
		case HrefBaseMediaPageSlug.Lists: {
			const indexRef = {index:1};
			hrefParts = {
				base,
			};
			parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
			return hrefParts;
		}
		case HrefBaseMediaPageSlug.Members: {
			const indexRef = {index:1};
			const membersType = hrefPieces[1];
			if(membersType === MembersType.HQ) {
				// HQ Members
				hrefParts = {
					base,
					membersType
				};
				indexRef.index += 2;
				const orgType = hrefPieces[indexRef.index];
				if(orgType !== undefined) {
					if(orgType != HrefFilterSlug.By && orgType != HrefFilterSlug.Popular) {
						hrefParts.orgType = orgType as HQMembersOrganizationType;
						indexRef.index += 1;
					}
					parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
				}
				return hrefParts;
			}
			// Members
			hrefParts = {
				base,
			};
			indexRef.index += 1;
			parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
			return hrefParts;
		}
		case HrefBaseMediaPageSlug.Reviewers: {
			const indexRef = {index:0};
			const subroute = hrefPieces[1];
			if(subroute !== 'popular') {
				throw new HrefParseError(
					hrefPieces,
					indexRef.index,
					1,
					"Missing subroute"
				);
			}
			const popular = parseHrefPopularFilterValuePieces(hrefPieces, indexRef, 2);
			hrefParts = {
				base,
				popular,
			};
			parseHrefFilterProps(hrefParts, hrefPieces, indexRef);
			return hrefParts;
		}
		case HrefBaseMediaPageSlug.Tag: {
			const indexRef = {index:0};
			const tagSlug = hrefPieces[1];
			if(tagSlug === undefined) {
				throw new HrefParseError(
					hrefPieces,
					indexRef.index,
					1,
					"Missing tag slug"
				);
			}
			hrefParts = {
				base,
				tagSlug
			};
			indexRef.index += 2;
			const tagsType = hrefPieces[indexRef.index];
			if(TagsTypesSet.has(tagsType as any)) {
				(hrefParts as {tagsType?: TagsType}).tagsType = tagsType as TagsType;
				indexRef.index += 1;
			}
			parseHrefFilterProps(hrefParts, hrefPieces, indexRef);
			return hrefParts;
		}
		case HrefBaseMediaPageSlug.Reviews: {
			const indexRef = {index:0};
			const subroute = hrefPieces[1];
			if(subroute !== 'popular') {
				throw new HrefParseError(
					hrefPieces,
					indexRef.index,
					1,
					"Missing subroute"
				);
			}
			const popular = parseHrefPopularFilterValuePieces(hrefPieces, indexRef, 2);
			hrefParts = {
				base,
				popular,
			};
			parseHrefFilterProps(hrefParts, hrefPieces, indexRef);
			return hrefParts;
		}
		case HrefBaseMediaPageSlug.Search: {
			const indexRef = {index:1};
			hrefParts = {
				base
			};
			if(hrefPieces.length > 3) {
				throw new HrefParseError(
					hrefPieces,
					indexRef.index,
					1,
					"Unknown search href"
				);
			}
			let searchType: (string | undefined) = hrefPieces[1];
			let query = hrefPieces[2];
			if(query === undefined) {
				query = searchType;
				searchType = undefined;
				if(query !== undefined) {
					indexRef.index += 1;
				}
			} else {
				indexRef.index += 2;
			}
			(hrefParts as {searchType?: SearchTypeSlug}).searchType = searchType as SearchTypeSlug;
			hrefParts.query = query;
			return hrefParts;
		}
		default: {
			const indexRef = {index:0};
			// try to parse Year in Review href
			if(base.length === 4) {
				const year = Number.parseInt(base);
				if(!Number.isNaN(year)) {
					const now = new Date();
					const nowYear = Math.max(now.getFullYear(), now.getUTCFullYear());
					if(year >= FirstYearInReview && year <= nowYear) {
						indexRef.index += 1;
						return {
							yearInReview: year,
							remainingHref: hrefPieces.slice(indexRef.index).join('/')
						};
					}
				}
			}
			// parse user href
			const userSlug = base;
			let userBase = hrefPieces[1];
			if(userBase === undefined) {
				hrefParts = {
					userSlug,
				};
				indexRef.index += 1;
				return hrefParts;
			}
			let offset = 2;
			switch(userBase) {
				case UserHrefBaseSlug.Films: {
					hrefParts = {
						userSlug,
						base: userBase
					};
					indexRef.index += offset;
					const subroute = hrefPieces[indexRef.index];
					if(UserFilmsHrefSubroutesSet.has(subroute as any)) {
						(hrefParts as {subroute?: string}).subroute = subroute;
						indexRef.index += 1;
					}
					parseHrefFilterProps(hrefParts, hrefPieces, indexRef);
					return hrefParts;
				}
				case UserHrefBaseSlug.Activity: {
					const activityType = hrefPieces[offset];
					if(UserActivityTypesSet.has(activityType as any)) {
						offset += 1;
					}
					else if(activityType !== undefined) {
						throw new HrefParseError(
							hrefPieces,
							indexRef.index,
							offset,
							"Unknown user activity route"
						);
					}
					hrefParts = {
						userSlug,
						base: userBase,
						activityType: activityType as (UserActivityType | undefined),
					};
					indexRef.index += offset;
					if(indexRef.index < hrefPieces.length) {
						throw new HrefParseError(
							hrefPieces,
							indexRef.index,
							1,
							"Unknown user activity subroute"
						);
					}
					return hrefParts;
				}
				case UserHrefBaseSlug.List: {
					const listSlug = hrefPieces[offset];
					if(listSlug === undefined) {
						throw new HrefParseError(
							hrefPieces,
							indexRef.index,
							2,
							"Missing list slug"
						);
					}
					hrefParts = {
						userSlug,
						base: userBase,
						listSlug,
					};
					indexRef.index += (offset + 1);
					const subroute = hrefPieces[indexRef.index];
					if(subroute === 'detail') {
						hrefParts.detail = true;
						indexRef.index += 1;
					}
					parseHrefFilterProps(hrefParts, hrefPieces, indexRef);
					return hrefParts;
				}
				case UserHrefBaseSlug.Likes: {
					const likesType = hrefPieces[offset];
					if(UserLikesTypesSet.has(likesType as any)) {
						hrefParts = {
							userSlug,
							base: userBase,
							likesType: likesType as UserLikesType,
						};
						indexRef.index += (offset + 1);
						return hrefParts;
					} else if(likesType !== undefined) {
						throw new HrefParseError(
							hrefPieces,
							indexRef.index,
							offset,
							"Unknown likes subroute slug"
						);
					}
					hrefParts = {
						userSlug,
						base: userBase,
					};
					indexRef.index += offset;
					return hrefParts;
				}
				case UserHrefBaseSlug.Tags: {
					hrefParts = {
						userSlug,
						base: userBase,
					};
					indexRef.index += offset;
					const tagsType = hrefPieces[indexRef.index];
					if(TagsTypesSet.has(tagsType as any)) {
						(hrefParts as {tagsType?: TagsType}).tagsType = tagsType as TagsType;
						indexRef.index += 1;
					}
					parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
					return hrefParts;
				}
				case UserHrefBaseSlug.Stories:
				case UserHrefBaseSlug.Watchlist:
				case UserHrefBaseSlug.Lists:
				case UserHrefBaseSlug.Followers:
				case UserHrefBaseSlug.Following:
					hrefParts = {
						userSlug,
						base: userBase,
					};
					indexRef.index += offset;
					parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
					return hrefParts;
				case UserHrefBaseSlug.Stats:
					hrefParts = {
						userSlug,
						base: userBase,
					};
					if((indexRef.index + offset) < hrefPieces.length) {
						throw new HrefParseError(
							hrefPieces,
							indexRef.index,
							offset,
							"Unknown stats subroute"
						);
					}
					indexRef.index += offset;
					return hrefParts;
				case 'friends':
					const friends: (true | undefined) = true;
					userBase = hrefPieces[offset];
					if(userBase != UserHrefBaseSlug.Tag && userBase != UserHrefBaseSlug.Film) {
						throw new HrefParseError(
							hrefPieces,
							indexRef.index,
							offset,
							"Unknown user friends subroute"
						);
					}
					offset += 1;
				case UserHrefBaseSlug.Tag:
					if(userBase === UserHrefBaseSlug.Tag) {
						const tagSlug = hrefPieces[offset];
						if(tagSlug === undefined) {
							throw new HrefParseError(
								hrefPieces,
								indexRef.index,
								offset,
								"Missing tag slug"
							);
						}
						hrefParts = {
							userSlug,
							friends,
							base: userBase,
							tagSlug,
						};
						indexRef.index += (offset + 1);
						const tagsType = hrefPieces[indexRef.index];
						if(TagsTypesSet.has(tagsType as any)) {
							(hrefParts as {tagsType?: TagsType}).tagsType = tagsType as TagsType;
							indexRef.index += 1;
						}
						parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
						return hrefParts;
					}
				case UserHrefBaseSlug.Film:
					if(userBase === UserHrefBaseSlug.Film) {
						const filmSlug = hrefPieces[offset];
						if(filmSlug === undefined) {
							throw new HrefParseError(
								hrefPieces,
								indexRef.index,
								offset,
								"Missing film slug"
							);
						}
						hrefParts = {
							userSlug,
							friends,
							base: userBase,
							filmSlug,
						};
						indexRef.index += (offset + 1);
						const subroute = hrefPieces[indexRef.index];
						let viewingId: (number | undefined) = undefined;
						let viewingSubroute: (string | undefined) = undefined;
						if(friends ? UserFriendsFilmSubroutesSet.has(subroute as any) : UserFilmSubroutesSet.has(subroute as any)) {
							if(!friends && subroute == UserFilmSubroute.Likes) {
								const likesType = hrefPieces[indexRef.index+1];
								if(UserFilmLikesTypeSet.has(likesType as any)) {
									(hrefParts as {subroute?: string}).subroute = subroute;
									(hrefParts as {likesType?: string}).likesType = likesType;
									indexRef.index += 2;
								}
								else if(likesType !== undefined) {
									throw new HrefParseError(
										hrefPieces,
										indexRef.index,
										1,
										"Unknown likes type"
									);
								} else {
									(hrefParts as {viewingSubroute?: string}).viewingSubroute = subroute;
									indexRef.index += 1;
								}
							} else {
								(hrefParts as {subroute?: string}).subroute = subroute;
								indexRef.index += 1;
							}
						} else if(subroute !== undefined) {
							if(!friends) {
								viewingId = Number.parseInt(subroute);
								if(!Number.isNaN(viewingId)) {
									(hrefParts as {viewingId: number}).viewingId = viewingId;
									indexRef.index += 1;
									viewingSubroute = hrefPieces[indexRef.index];
									if(UserFilmViewingSubroutesSet.has(subroute as any)) {
										(hrefParts as {viewingSubroute?: string}).viewingSubroute = viewingSubroute;
										indexRef.index += 1;
									}
									else if(subroute !== undefined) {
										throw new HrefParseError(
											hrefPieces,
											indexRef.index,
											0,
											"Unknown user film viewing subroute"
										);
									}
									else {
										viewingSubroute = undefined;
									}
								} else {
									viewingId = undefined;
								}
							}
						}
						if(viewingId === undefined || viewingSubroute !== undefined) {
							parseHrefFilterProps(hrefParts as HrefFilterProps, hrefPieces, indexRef);
						} else if(indexRef.index < hrefPieces.length) {
							throw new HrefParseError(
								hrefPieces,
								indexRef.index,
								0,
								"Unknown user film subroute"
							);
						}
						return hrefParts;
					}
				default:
					throw new HrefParseError(
						hrefPieces,
						indexRef.index,
						offset,
						"Unknown user subroute"
					);
			}
		}
	}
};
