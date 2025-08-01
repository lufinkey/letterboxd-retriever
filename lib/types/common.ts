
export type User = {
	imageURL?: string;
	href: string;
	username: string;
	displayName: string;
};

export type Viewing = {
	id?: string;
	user: User;
	href: string;
	rating?: number | undefined; // 0-10
	liked?: boolean;
	text?: string;
	fullTextHref?: string;
	hasMoreText?: boolean;
	date?: string;
	isRewatch?: boolean;
	// TODO add comments count, etc
};

export type Film = {
	id?: string;
	href: string;
	type: 'film' | string;
	name: string;
	slug: string;
	year?: string;
	imageURL?: string | undefined;
};

export type FilmList = {
	id?: string;
	href: string;
	name: string;
	films?: Film[];
	owner: User;
	totalCount?: number;
};

export type PageBackdrop = {
	default: string;
	retina: string;
	mobile: string
};

export type PosterSize = {
	width: number;
	height: number;
};

export type Pagination = {
	nextPageHref?: string | null;
	prevPageHref?: string | null;
};
