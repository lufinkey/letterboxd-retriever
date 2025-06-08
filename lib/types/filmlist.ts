
import {
	Film,
	PageBackdrop
} from './common';

export type FilmsPage = {
	items: Film[];
};

export type FilmListItem = {
	id: string;
	order: number;
	ownerRating: number;
	film: Film;
	notesText?: string;
	notesHtml?: string;
	hasMoreNotes?: boolean;
	fullNotesHref?: string;
	viewingHref?: string;
	viewingDate?: string;
};

export type FilmListPage = {
	title: string;
	descriptionText?: string;
	descriptionHtml?: string;
	items: FilmListItem[];
	prevPageHref: string | null;
	nextPageHref: string | null;
	totalCount?: number | undefined;
	backdrop?: PageBackdrop | null;
	publishedAt: Date;
	updatedAt?: Date | undefined;
};
