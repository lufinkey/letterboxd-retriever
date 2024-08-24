
export type User = {
	imageURL?: string;
	href: string;
	username: string;
	displayName: string;
};

export type Viewing = {
	user: User;
	href: string;
	rating?: number | undefined; // 0-10
	text?: string;
	liked?: boolean;
	// TODO add comments count, hasMore
};

export type Film = {
	imageURL?: string | undefined;
	name: string;
	slug: string;
	href: string;
	year?: string;
};
