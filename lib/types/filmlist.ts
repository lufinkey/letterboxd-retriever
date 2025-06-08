
import {
	Film,
	PageBackdrop,
	Pagination,
} from './common';

export type FilmsPage = {
	items: Film[];
} & Pagination;

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
	totalCount?: number | undefined;
	backdrop?: PageBackdrop | null;
	publishedAt: Date;
	updatedAt?: Date | undefined;
} & Pagination;
