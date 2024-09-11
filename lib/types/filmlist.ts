
import { Film } from './common';

export type FilmsPage = {
	items: Film[]
};

export type FilmListItem = {
	id: string;
	ownerRating: number;
	film: Film;
};

export type FilmListPage = {
	items: FilmListItem[];
	prevPageHref: string | null;
	nextPageHref: string | null;
};
