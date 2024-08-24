
import {
	User,
	Viewing,
	Film
} from './common';

export enum ActivityActionType {
	Watched = 'watched',
	Rewatched = 'rewatched',
	Liked = 'liked',
	Rated = 'rated',
	LikedReview = 'liked-review',
	AddedToWatchlist = 'added-to-watchlist'
}

export interface ActivityFeedEntry {
	id: string;
	user: User;
	actions: ActivityActionType[];
	viewing?: Viewing | undefined;
	film?: Film | undefined;
	time: Date;
}

export interface ActivityFeedPage {
	items: ActivityFeedEntry[];
	csrf: string;
	end: boolean;
}
