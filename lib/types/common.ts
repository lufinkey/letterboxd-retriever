
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
	// TODO add comments count, hasMore
};

export type Film = {
	id?: string;
	imageURL?: string | undefined;
	name: string;
	slug: string;
	href: string;
	year?: string;
};
