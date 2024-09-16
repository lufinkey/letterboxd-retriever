
import {
	Film,
	PageBackdrop
} from './common';

export type FilmsPage = {
	items: Film[]
};

export type FilmListItem = {
	id: string;
	order: number;
	ownerRating: number;
	film: Film;
};

export type FilmListPage = {
	items: FilmListItem[];
	prevPageHref: string | null;
	nextPageHref: string | null;
	totalCount?: number | undefined;
	backdrop?: PageBackdrop | null;
	publishedAt: Date;
	updatedAt?: Date | undefined;
};
