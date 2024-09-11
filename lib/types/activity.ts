
import {
	User,
	Viewing,
	Film,
	FilmList
} from './common';

export enum ActivityActionType {
	Watched = 'watched',
	Rewatched = 'rewatched',
	Liked = 'liked',
	Rated = 'rated',
	LikedReview = 'liked-review',
	AddedToWatchlist = 'added-to-watchlist',
	Listed = 'listed'
}

export type ActivityFeedEntry = {
	id: string;
	user: User;
	actions: ActivityActionType[];
	viewing?: Viewing | undefined;
	film?: Film | undefined;
	filmList?: FilmList | undefined;
	time: Date;
}

export type ActivityFeedPage = {
	items: ActivityFeedEntry[];
	csrf: string;
	end: boolean;
}
