
import {
	Viewing,
	Pagination,
} from './common';

export type ReviewsPage = {
	items: Viewing[],
} & Pagination;
