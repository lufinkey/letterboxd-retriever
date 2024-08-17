
export enum ActivityActionType {
	Watched = 'watched',
	Rewatched = 'rewatched',
	Liked = 'liked',
	Rated = 'rated',
	LikedReview = 'liked-review',
	AddedToWatchlist = 'added-to-watchlist'
}

export interface ActivityFeedViewing {
	username: string;
	userDisplayName: string;
	href: string;
	rating?: number | undefined; // 0-10
	text?: string;
	liked?: boolean;
}

export interface ActivityFeedFilm {
	imageURL?: string | undefined;
	name: string;
	slug: string;
	href: string;
	year?: string;
}

export interface ActivityFeedEntry {
	id: string;
	userImageURL: string;
	userHref: string;
	username: string;
	userDisplayName: string;
	actions: ActivityActionType[];
	viewing?: ActivityFeedViewing | undefined;
	film?: ActivityFeedFilm | undefined;
	time: Date;
}

export interface ActivityFeedPage {
	items: ActivityFeedEntry[];
	csrf: string;
	end: boolean;
}

export enum ObjectType {
	Movie = 'Movie',
	Person = 'Person',
	Organization = 'Organization',
	PublicationEvent = 'PublicationEvent',
	Country = 'Country',
	aggregateRating = 'aggregateRating'
}

export enum GenreType {
	Adventure = 'Adventure',
	Drama = 'Drama',
	Action = 'Action'
}

export interface FilmLDJson {
	image: string; // "https://a.ltrbxd.com/resized/film-poster/6/4/1/6/0/8/641608-twisters-0-230-0-345-crop.jpg?v=b1bb3d5cc7"
	'@type': ObjectType.Movie,
	director: {
		'@type':  ObjectType.Person;
		name: string; // "Lee Isaac Chung",
		sameAs: string; // "/director/lee-isaac-chung/"
	}[];
	dateModified: string; // "2024-08-06",
	productionCompany: {
		'@type': ObjectType.Organization;
		name: string; // "Universal Pictures"
		sameAs: string; // "/studio/universal-pictures/"
	}[];
	releasedEvent?: {
		'@type': ObjectType.PublicationEvent,
		startDate: string; // "2024"
	}[],
	'@context': string; // "http://schema.org"
	url: string; // "https://letterboxd.com/film/twisters/"
	actors: {
		'@type': ObjectType.Person;
		name: string; // "Daisy Edgar-Jones"
		sameAs: string; // "/actor/daisy-edgar-jones/"
	}[];
	dateCreated: string; // "2020-06-25"
	name: string; // "Twisters"
	genre: GenreType[],
	'@id': string; // "https://letterboxd.com/film/twisters/"
	countryOfOrigin: {
		'@type': ObjectType.Country;
		name: string; // "USA"
	}[],
	aggregateRating: {
		bestRating: number; // 5
		reviewCount: number; // 169924
		'@type': ObjectType.aggregateRating,
		ratingValue: number; // 3.44
		description: string; // "The Letterboxd rating is a weighted average score for a movie based on all ratings cast to date by our members."
		ratingCount: number; // 324256
		worstRating: number; // 0
	}
}

export interface FilmPageData {
	id: string;
	slug: string;
	type: 'film';
	tagline: string;
	description: string;
	tmdb: {
		id: string;
		type: 'movie'
	},
	backdrop: {
		default: string;
		retina: string;
		mobile: string
	};
}

export interface FilmInfo {
	pageData: FilmPageData;
	ldJson: FilmLDJson;
}
