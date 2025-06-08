import {
	User,
	Viewing,
	Film,
	PageBackdrop
} from './common';

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

export type FilmLDJson = {
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
};

export enum TmdbMediaType {
	Movie = 'movie',
	TV = 'tv'
};

export type FilmPageData = {
	id: string;
	slug: string;
	type: 'film';
	name: string;
	year: string;
	tagline: string;
	description: string;
	tmdb?: {
		id: string;
		type: TmdbMediaType;
		url: string;
	} | undefined,
	imdb?: {
		id: string;
		url: string;
	} | undefined,
	backdrop: PageBackdrop;
	cast: CastMember[];
	crew: CrewMember[];
	relatedFilms: RelatedFilmsList | null;
	similarFilms: RelatedFilmsList | null;
	popularReviews: Viewing[];
};

export type FilmPage = {
	pageData: FilmPageData;
	ldJson: FilmLDJson;
};

export type CastMember = {
	href: string;
	name: string;
	role: string;
};

export enum CrewRoleType {
	Director = 'Director',
	Producer = 'Producer',
	Writer = 'Writer',
	Casting = 'Casting',
	Editor = 'Editor',
	Cinematography = 'Cinematography',
	ExecutiveProducer = 'Executive Producer',
	ProductionDesign = 'Production Design',
	ArtDirection = 'Art Direction',
	SetDecoration = 'Set Decoration',
	Stunts = 'Stunts',
	Composer = 'Composer',
	Songs = 'Songs',
	CostumeDesign = 'Costume Design',
	Makeup = 'Makeup'
}

export type CrewMember = {
	href: string;
	name: string;
	role: CrewRoleType | string;
};

export type RelatedFilmsList = {
	title: string;
	href: string;
	hasMore: boolean;
	items: Film[];
};
