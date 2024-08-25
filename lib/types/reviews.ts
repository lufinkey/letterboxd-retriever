
import { Viewing } from './common';

export type ReviewsPage = {
	items: Viewing[],
	nextPage: {
		href: string,
		page: number
	} | null
};
