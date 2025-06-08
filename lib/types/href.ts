
// Filters

export enum PopularityReferenceTime {
	This = 'this'
}
export const PopularityReferenceTimes = Object.values(PopularityReferenceTime);

export enum PopularityTimeSpan {
	Year = 'year',
	Month = 'month',
	Week = 'week',
}
export const PopularityTimeSpans = Object.values(PopularityTimeSpan);

export type PopularFilterProps = {
	refTime: PopularityReferenceTime;
	span: PopularityTimeSpan;
}

export type PopularFilter = true | PopularFilterProps;

export enum RatingSlug {
	None = 'none',
	HalfStar = 0.5,
	OneStar = 1,
	OneAndAHalfStars = 1.5,
	TwoStars = 2,
	TwoAndAHalfStars = 2.5,
	ThreeStars = 3,
	ThreeAndAHalfStars = 3.5,
	FourStars = 4,
	FourAndAHalfStars = 4.5,
	FiveStars = 5
}
export type RatingFilter = RatingSlug | `${RatingSlug}`;

export enum DecadeSlug {
	The1870s = '1870s',
	The1880s = '1880s',
	The1890s = '1890s',
	The1900s = '1900s',
	The1910s = '1910s',
	The1920s = '1920s',
	The1930s = '1930s',
	The1940s = '1940s',
	The1950s = '1950s',
	The1960s = '1960s',
	The1970s = '1970s',
	The1980s = '1980s',
	The1990s = '1990s',
	The2000s = '2000s',
	The2010s = '2010s',
	The2020s = '2020s',
}

export type HrefTimespanFilterProps = {upcoming: true} | {decade: (`${number}0s` | DecadeSlug)} | {year: number | `${number}`} | {};

export enum GenreSlug {
	Action = 'action',
	Adventure = 'adventure',
	Animation = 'animation',
	Comedy = 'comedy',
	Crime = 'crime',
	Documentary = 'documentary',
	Drama = 'drama',
	Family = 'family',
	Fantasy = 'fantasy',
	History = 'history',
	Horror = 'horror',
	Music = 'music',
	Mystery = 'mystery',
	Romance = 'romance',
	ScienceFiction = 'science-fiction',
	Thriller = 'thriller',
	TVMovie = 'tv-movie',
	War = 'war',
	Western = 'western',
}

export type ExcludeGenreSlug = `-${GenreSlug}`;
export type IncludeGenreSlug = `+${GenreSlug}`;
export type AnyGenreSlug = (GenreSlug | IncludeGenreSlug | ExcludeGenreSlug);
export type GenreSlugArray = AnyGenreSlug[];
export type GenreFilter = GenreSlugArray | AnyGenreSlug;

export const excludeGenre = (genre: GenreSlug): ExcludeGenreSlug => {
	return `-${genre}`;
};

export enum StreamingServiceSlug {
	AmazonUSA = 'amazon-usa',
	AmazonVideoUSA = 'amazon-video-us',
	AppleTVPlusUSA = 'apple-tv-plus-us',
	AppleTVUSA = 'apple-itunes-us',
}

export enum RoleSlug {
	AdditionalDirecting = 'additional-directing',
	AdditionalPhotography = 'additional-photography',
	ArtDirection = 'art-direction',
	AssistantDirector = 'assistant-director',
	CameraOperator = 'camera-operator',
	Casting = 'casting',
	Choreography = 'choreography',
	Cinematography = 'cinematography',
	CoDirector = 'co-director',
	Composer = 'composer',
	CostumeDesign = 'costume-design',
	Director = 'director',
	Editor = 'editor',
	ExecutiveProducer = 'executive-producer',
	Hairstyling = 'hairstyling',
	Lighting = 'lighting',
	Makeup = 'makeup',
	OriginalWriter = 'original-writer',
	Producer = 'producer',
	ProductionDesign = 'production-design',
	SetDecoration = 'set-decoration',
	Songs = 'songs',
	Sound = 'sound',
	SpecialEffects = 'special-effects',
	Stunts = 'stunts',
	Studio = 'studio',
	Story = 'story',
	TitleDesign = 'title-design',
	VisualEffects = 'visual-effects',
	Writer = 'writer',
}

export type RoleFilter = {
	roleSlug: RoleSlug;
	personSlug: string;
};

export enum SizeSlug {
	Large = 'large',
}

export enum FilmFilterCookieValue {
	ShowShorts = 'show-shorts',
	HideShorts = 'hide-shorts',
	ShowTV = 'show-tv',
	HideTV = 'hide-tv',
	HideDocumentaries = 'hide-docs',
	HideUnreleased = 'hide-unreleased',
}



export enum SortByFilter {
	Name = 'name', // asc
	BestMatch = 'best-match', // desc
	MostPopular = 'popular', // desc
	Shuffle = 'shuffle',
	Activity = 'activity',
	DiaryCount = 'diary-count', // desc
	ReviewCount = 'review-count', // desc

	NewestAdded = 'added', // desc
	EarliestAdded = 'added-earliest', // asc

	NewestRelease = 'release', // desc
	EarliestRelease = 'release-earliest', // asc
	HighestRating = 'rating', // desc
	LowestRating = 'rating-lowest', // asc
	ShortestLength = 'shortest', // asc
	LongestLength = 'longest', // desc

	NewestInOwnerDiary = 'owner-diary', // desc
	EarliestInOwnerDiary = 'owner-diary-earliest', // asc
	HighestOwnerRating = 'owner-rating', // desc
	LowestOwnerRating = 'owner-rating-lowest', // asc

	NewestDate = 'date', // desc
	EarliestDate = 'date-earliest', // asc
	NewestDateRated = 'rated-date', // desc
	EarliestDateRated = 'rated-date-earliest', // asc
	HighestEntryRating = 'entry-rating', // desc
	LowestEntryRating = 'entry-rating-lowest', // asc

	HighestMemberRating = 'member-rating', // desc
	LowestMemberRating = 'member-rating-lowest', // asc

	Newest = 'newest', // desc
	Oldest = 'oldest', // asc
	
	NewestUpdated = 'updated', // desc
	OldestUpdated = 'updated-oldest', // asc

	Week = 'week', // desc
	Month = 'month', // desc
	Year = 'year', // desc

	WhenJoined = 'whenJoined', // desc

	Billing = 'billing', // desc

	Title = 'title', // asc
	NewestPublished = 'published', // desc
	OldestPublished = 'published-oldest', // asc

}

export type FilmsSortByFilter =
	SortByFilter.Name
	| SortByFilter.BestMatch
	| SortByFilter.NewestRelease
	| SortByFilter.EarliestRelease
	| SortByFilter.HighestRating
	| SortByFilter.LowestRating
	| SortByFilter.ShortestLength
	| SortByFilter.LongestLength;

export type DiarySortByFilter =
	FilmsSortByFilter
	| SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.Activity
	| SortByFilter.MostPopular
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type ReviewsSortByFilter =
	FilmsSortByFilter
	| SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.Activity
	| SortByFilter.MostPopular
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type ListsSortByFilter =
	SortByFilter.Name
	| SortByFilter.MostPopular
	| SortByFilter.NewestUpdated
	| SortByFilter.Newest
	| SortByFilter.Oldest;

export type HrefSortOrPopularFilterProps<TSortBy = SortByFilter> = {popular: PopularFilter} | {by: TSortBy} | {};



// /films/

export type FilmsHrefArgs =
HrefSortOrPopularFilterProps<FilmsSortByFilter> & {
	rated?: RatingFilter;
} & HrefTimespanFilterProps & {
	like?: string;
	in?: string;
	genre?: GenreFilter;
	nanogenre?: string;
	theme?: string;
	minitheme?: string;
	on?: StreamingServiceSlug;
	with?: RoleFilter;
	// by: SortByFilter // default is by popular
	size?: SizeSlug;
	page?: number | `${number}`;
};

// /film/

export enum FilmHrefSubroute {
	Similar = 'similar',
	Themes = 'themes',
	Nanogenres = 'nanogenres',
	Crew = 'crew',
	Details = 'details',
	Genres = 'genres',
	Releases = 'releases',
	Members = 'members',
	Fans = 'fans',
	Likes = 'likes',
	Reviews = 'reviews',
	Lists = 'lists',
};
export const FilmHrefSubroutes = Object.values(FilmHrefSubroute);
export const FilmHrefSubroutesSet = new Set(FilmHrefSubroutes);

// /film/<filmSlug>/similar/

export type SimilarToFilmHrefArgs =
HrefTimespanFilterProps & {
	on?: StreamingServiceSlug;
};

// /film/<filmSlug>/themes/

export type FilmThemesHrefArgs =
HrefTimespanFilterProps & {
	on?: StreamingServiceSlug;
};

// /film/<filmSlug>/nanogenres

export type FilmNanogenresHrefArgs =
HrefTimespanFilterProps & {
	on?: StreamingServiceSlug;
};

// /film/<filmSlug>/members/

export type FilmMembersSortByFilter =
	SortByFilter.Name
	| SortByFilter.MostPopular
	| SortByFilter.NewestDate
	| SortByFilter.EarliestDate;

export type FilmMembersHrefArgs = {
	rated?: RatingFilter;
	by?: FilmMembersSortByFilter;
};

// /film/<filmSlug>/likes/

export type FilmLikesSortByFilter =
	SortByFilter.Name
	| SortByFilter.MostPopular
	| SortByFilter.NewestDate
	| SortByFilter.EarliestDate;

export type FilmLikesHrefArgs = {
	by?: FilmLikesSortByFilter;
};

// /film/<filmSlug>/reviews/

export type FilmReviewsSortByFilter =
	SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.Activity
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type FilmReviewsHrefArgs = {
	rated?: RatingFilter;
	by?: FilmReviewsSortByFilter;
};

// /film/<filmSlug>/lists/

export type FilmListsSortByFilter =
	SortByFilter.Name
	| SortByFilter.MostPopular
	| SortByFilter.NewestUpdated
	| SortByFilter.Newest
	| SortByFilter.Oldest;

export type FilmListsHrefArgs = {
	by?: FilmListsSortByFilter;
};

// /lists/

export type ListsHrefArgs = {
	popular?: PopularFilter;
};

// /members/

export enum MembersType {
	HQ = 'hq',
};

export type MembersHrefArgs = {
	popular?: PopularFilter;
} | {
	popular: PopularFilter;
	page?: number | `${number}`;
};

// /members/hq/

export type HQMembersSortByFilter =
	SortByFilter.Name
	| SortByFilter.NewestDate;

export enum HQMembersOrganizationType {
	ClubOrSociety = 'societies',
	Educator = 'educators',
	Exhibitor = 'exhibitors',
	Festival = 'festivals',
	FilmOrFilmmaker = 'films',
	GenreOrSpecialty = 'genres',
	IndustryOrAssociation = 'associations',
	MediaOrPublisher = 'publishers',
	PlatformOrProduct = 'platforms',
	Podcast = 'podcasts',
	Streamer = 'streamers',
	StudioOrDistributor = 'studios'
}
export const HQMembersOrganizationTypes = Object.values(HQMembersOrganizationType);
export const HQMembersOrganizationTypesSet = new Set(HQMembersOrganizationTypes);

export type HQMembersHrefArgs =
HrefSortOrPopularFilterProps<HQMembersSortByFilter> & {
	orgType?: HQMembersOrganizationType;
	// by?: HQMembersSortByFilter // default is since last story
	page?: number | `${number}`;
};

// /reviewers/

export type ReviewersHrefArgs = {
	popular: PopularFilter;
};

// /tag/<tagSlug>/

export enum TagsType {
	Films = 'films',
	Diary = 'diary',
	Reviews = 'reviews',
	Lists = 'lists',
}
export const TagsTypes = Object.values(TagsType);
export const TagsTypesSet = new Set(TagsTypes);

// /tag/<tagSlug>/films/

type TagFilmsFilters =
HrefTimespanFilterProps & {
	genre?: GenreFilter;
	on?: StreamingServiceSlug;
	by?: TagFilmsSortByFilter;
	page?: number | `${number}`;
};

export type TagFilmsSortByFilter =
	FilmsSortByFilter
	| SortByFilter.MostPopular
	| SortByFilter.Week
	| SortByFilter.Month
	| SortByFilter.Year;

export type TagFilmsHrefArgs = TagFilmsFilters;

// /tag/<tagSlug>/diary/

export type TagDiarySortByFilter = DiarySortByFilter;

export type TagDiaryHrefArgs = {
	by?: TagDiarySortByFilter;
	page?: number | `${number}`;
};

// /tag/<tagSlug>/reviews/

export type TagReviewsSortByFilter = ReviewsSortByFilter;

export type TagReviewsHrefArgs = {
	by?: TagReviewsSortByFilter; // default is by added (when reviewed)
	page?: number | `${number}`;
};

// /tag/<tagSlug>/lists/

export type TagListsSortByFilter = ListsSortByFilter;

export type TagListsHrefArgs = {
	by?: TagListsSortByFilter;
	page?: number | `${number}`;
};

// /reviews/

export type ReviewsHrefArgs = {
	popular: PopularFilter;
};

// /search/

export enum SearchTypeSlug {
	Films = 'films',
	Reviews = 'reviews',
	Lists = 'lists',
	OriginalLists = 'original-lists',
	Stories = 'stories',
	CastOrCrewOrStudios = 'cast-crew',
	MembersOrHQs = 'members',
	Tags = 'tags',
	Articles = 'articles',
	PodcastEpisodes = 'episodes',
	FullText = 'full-text',
}
export const SearchTypeSlugs = Object.values(SearchTypeSlug);
export const SearchTypeSlugsSet = new Set(SearchTypeSlugs);

export type SearchHrefArgs = {
	searchType: SearchTypeSlug;
	query: string;
} | {
	query?: string;
};

// /<roleType>/<personSlug>/

export type RolePersonSortByFilter =
	FilmsSortByFilter
	| SortByFilter.Billing;

export type RolePersonHrefArgs =
HrefTimespanFilterProps & {
	genre?: GenreFilter;
	on?: StreamingServiceSlug;
	by?: RolePersonSortByFilter;
};

// /<2012...>/

export const FirstYearInReview = 2012;

// /<otherPageSlug>/

export enum OtherPageSlug {
	Showdown = 'showdown',
	Journal = 'journal',
	About = 'about',
	GiftGuide = 'gift-guide',
	Legal = 'legal',
	Welcome = 'welcome',
	Apps = 'apps',
	Pro = 'pro',
	Contact = 'contact',
	APIBeta = 'api-beta',
	API = 'api',
}
export const OtherPageSlugs: OtherPageSlug[] = Object.values(OtherPageSlug);

// /<userSlug>/

export enum UserHrefBaseSlug {
	Stories = 'stories',
	Activity = 'activity',
	Films = 'films',
	Film = 'film',
	Watchlist = 'watchlist',
	Lists = 'lists',
	List = 'list',
	Likes = 'likes',
	Tags = 'tags',
	Tag = 'tag',
	Following = 'following',
	Followers = 'followers',
	Stats = 'stats',
}
export const UserHrefBaseSlugs = Object.values(UserHrefBaseSlug);
export const UserHrefBaseSlugsSet = new Set(UserHrefBaseSlugs);

export enum UserFilmsHrefSubroute {
	Diary = 'diary',
	Reviews = 'reviews',
}
export const UserFilmsHrefSubroutes = Object.values(UserFilmsHrefSubroute);
export const UserFilmsHrefSubroutesSet = new Set(UserFilmsHrefSubroutes);

// /<userSlug>/activity/

export enum UserActivityType {
	Following = 'following',
}
export const UserActivityTypes = Object.values(UserActivityType);
export const UserActivityTypesSet = new Set(UserActivityTypes);

// /<userSlug>/films/

export type UserFilmsSortByFilter =
	FilmsSortByFilter
	| SortByFilter.NewestDate
	| SortByFilter.EarliestDate
	| SortByFilter.NewestDateRated
	| SortByFilter.EarliestDateRated
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type UserFilmsHrefArgs = {
	rated?: RatingFilter;
} & HrefTimespanFilterProps & {
	like?: string;
	in?: string;
	genre?: GenreFilter;
	nanogenre?: string;
	theme?: string;
	minitheme?: string;
	on?: StreamingServiceSlug;
	with?: RoleFilter;
	by?: UserFilmsSortByFilter; // default is by release date
	page?: number | `${number}`;
};

// /<userSlug>/films/diary/

export type UserDiarySortByFilter =
	DiarySortByFilter
	| SortByFilter.DiaryCount;

export type UserDiaryHrefArgs = {
	for?: number | `${number}`; // year
	rated?: RatingFilter;
} & HrefTimespanFilterProps & {
	genre?: GenreFilter;
	on?: StreamingServiceSlug;
	by?: UserDiarySortByFilter; // default is by watched date
	page?: number | `${number}`;
};

// /<userSlug>/films/reviews

export type UserReviewsSortByFilter =
	ReviewsSortByFilter
	| SortByFilter.ReviewCount;

export type UserReviewsHrefArgs = {
	for?: number | `${number}`; // year
	rated?: RatingFilter;
	by?: UserReviewsSortByFilter; // default is by added (when reviewed)
	page?: number | `${number}`;
};

// /<userSlug>/film/<filmSlug>/

export enum UserFilmSubroute {
	Activity = 'activity',
	Diary = 'diary',
	Reviews = 'reviews',
	Lists = 'lists',
	Likes = 'likes',
}
export const UserFilmSubroutes = Object.values(UserFilmSubroute);
export const UserFilmSubroutesSet = new Set(UserFilmSubroutes);

// /<userSlug>/film/<filmSlug>/1/

export enum UserFilmViewingSubroute {
	Likes = 'likes',
}
export const UserFilmViewingSubroutes = Object.values(UserFilmViewingSubroute);
export const UserFilmViewingSubroutesSet = new Set(UserFilmViewingSubroutes);

// /<userSlug>/film/<filmSlug>/diary/

export type UserFilmDiarySortByFilter =
	SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.Activity
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type UserFilmDiaryHrefArgs = {
	for?: number | `${number}`; // year
	rated?: RatingFilter;
	by?: UserFilmDiarySortByFilter;
};

// /<userSlug>/film/<filmSlug>/reviews/

export type UserFilmReviewsSortByFilter =
	SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.Activity
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type UserFilmReviewsHrefArgs = {
	rated?: RatingFilter; // year
	by?: UserFilmReviewsSortByFilter;
};

// /<userSlug>/film/<filmSlug>/lists/

export type UserFilmListsSortByFilter = ListsSortByFilter;

export type UserFilmListsHrefArgs = {
	by?: UserFilmListsSortByFilter;
};

// /<userSlug>/film/<filmSlug>/likes/

export enum UserFilmLikesType {
	Reviews = 'reviews',
	Lists = 'lists',
}
export const UserFilmLikesTypes = Object.values(UserFilmLikesType);
export const UserFilmLikesTypeSet = new Set(UserFilmLikesTypes);

// /<userSlug>/film/<filmSlug>/likes/reviews/

export type UserFilmLikedReviewsSortByFilter =
	SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.Activity
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type UserFilmLikedReviewsHrefArgs = {
	rated?: RatingFilter;
	by?: UserFilmLikedReviewsSortByFilter;
};

// /<userSlug>/film/<filmSlug>/likes/lists/

export type UserFilmLikedListsSortByFilter = ListsSortByFilter;

export type UserFilmLikedListsHrefArgs = {
	by?: UserFilmLikedListsSortByFilter;
};

// /<userSlug>/friends/film/<filmSlug>/

export enum UserFriendsFilmSubroute {
	Fans = 'fans',
	Likes = 'likes',
	Reviews = 'reviews',
	Lists = 'lists',
}
export const UserFriendsFilmSubroutes = Object.values(UserFriendsFilmSubroute);
export const UserFriendsFilmSubroutesSet = new Set(UserFriendsFilmSubroutes);

export type UserFriendsFilmMembersSortByFilter =
	FilmMembersSortByFilter
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type UserFriendsFilmMembersHrefArgs = {
	rated?: RatingFilter;
	by?: UserFriendsFilmMembersSortByFilter
};

// /<userSlug>/friends/film/<filmSlug>/likes/

export type UserFriendsFilmLikesSortByFilter =
	FilmLikesSortByFilter
	| SortByFilter.HighestMemberRating
	| SortByFilter.LowestMemberRating;

export type UserFriendsFilmLikesHrefArgs = {
	by?: UserFriendsFilmLikesSortByFilter;
};

// /<userSlug>/friends/film/<filmSlug>/reviews/

export type UserFriendsFilmReviewsSortByFilter =
	SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.Activity
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating;

export type UserFriendsFilmReviewsHrefArgs = {
	rated?: RatingFilter;
	by?: UserFriendsFilmReviewsSortByFilter;
};

// /<userSlug>/friends/film/<filmSlug>/lists/

export type UserFriendsFilmListsSortByFilter = ListsSortByFilter;

export type UserFriendsFilmListsHrefArgs = {
	by?: UserFriendsFilmListsSortByFilter;
};

// /<userSlug>/stories/

export type UserStoriesSortByFilter =
	SortByFilter.Title
	| SortByFilter.NewestPublished
	| SortByFilter.OldestPublished
	| SortByFilter.NewestUpdated
	| SortByFilter.OldestUpdated;

export type UserStoriesHrefArgs = {
	by?: UserStoriesSortByFilter;
	page?: number | `${number}`;
};

// /<userSlug>/watchlist

export type UserWatchlistSortByFilter =
	FilmsSortByFilter
	| SortByFilter.MostPopular
	| SortByFilter.Shuffle
	| SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.HighestMemberRating
	| SortByFilter.LowestMemberRating;

export type UserWatchlistHrefArgs =
HrefTimespanFilterProps & {
	genre?: GenreFilter;
	on?: StreamingServiceSlug;
	by?: UserWatchlistSortByFilter; // default is by added
	page?: number | `${number}`;
};

// /<userSlug>/lists

export type UserListsHrefArgs = {
	by?: ListsSortByFilter; // default is by updated
	page?: number | `${number}`;
};

// /<userSlug>/list/<listSlug>/

export type ListSortByFilter =
	FilmsSortByFilter
	| SortByFilter.MostPopular
	| SortByFilter.Shuffle
	| SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.NewestInOwnerDiary
	| SortByFilter.EarliestInOwnerDiary
	| SortByFilter.HighestOwnerRating
	| SortByFilter.LowestOwnerRating;

export type ListHrefArgs = {
	detail?: true;
} & HrefTimespanFilterProps & {
	genre?: GenreFilter;
	on?: StreamingServiceSlug;
	by?: ListSortByFilter; // default is by list order
	page?: number | `${number}`;
};

// /<userSlug>/likes

export enum UserLikesType {
	Films = 'films',
	Reviews = 'reviews',
	Lists = 'lists',
}
export const UserLikesTypes = Object.values(UserLikesType);
export const UserLikesTypesSet = new Set(UserLikesTypes);

// /<userSlug>/likes/films

export type UserLikedFilmsSortByFilter =
	FilmsSortByFilter
	| SortByFilter.MostPopular
	| SortByFilter.Shuffle
	| SortByFilter.NewestDate
	| SortByFilter.EarliestDate
	| SortByFilter.HighestMemberRating
	| SortByFilter.LowestMemberRating;

export type UserLikedFilmsHrefArgs = {
	rated?: RatingFilter;
} & HrefTimespanFilterProps & {
	genre?: GenreFilter;
	on?: StreamingServiceSlug;
	by?: UserLikedFilmsSortByFilter; // default is when liked
	page?: number | `${number}`;
};

// /<userSlug>/likes/reviews/

export type UserLikedReviewsSortByFilter =
	FilmsSortByFilter
	| SortByFilter.NewestAdded
	| SortByFilter.EarliestAdded
	| SortByFilter.Activity
	| SortByFilter.ReviewCount
	| SortByFilter.MostPopular
	| SortByFilter.HighestEntryRating
	| SortByFilter.LowestEntryRating
	| SortByFilter.HighestMemberRating
	| SortByFilter.LowestMemberRating;

export type UserLikedReviewsHrefArgs = {
	rated?: RatingFilter;
	by?: UserLikedReviewsSortByFilter; // default is when liked
	page?: number | `${number}`;
};

// /<userSlug>/likes/lists/

export type UserLikedListsSortByFilter = ListsSortByFilter;

export type UserLikedListsHrefArgs = {
	by?: UserLikedListsSortByFilter; // default is when liked
	page?: number | `${number}`;
};

// /<userSlug>/tags/

export type UserTagsSortByFilter =
	SortByFilter.MostPopular
	| SortByFilter.Name;

export type UserTagsHrefArgs = {
	by?: UserTagsSortByFilter; // default is by popular
};

// /<userSlug>/tag/<tagSlug>/films/

export type UserTagFilmsSortByFilter =
	TagFilmsSortByFilter
	| SortByFilter.NewestDate
	| SortByFilter.EarliestDate
	| SortByFilter.HighestMemberRating
	| SortByFilter.LowestMemberRating;

export type UserTagFilmsHrefArgs =
TagFilmsFilters & {
	by?: UserTagFilmsSortByFilter;
};

// /<userSlug>/tag/<tagSlug>/diary/

export type UserTagDiarySortByFilter = UserDiarySortByFilter;

export type UserTagDiaryHrefArgs = {
	for?: number | `${number}`; // year
	rated?: RatingFilter;
} & HrefTimespanFilterProps & {
	genre?: GenreFilter;
	on?: StreamingServiceSlug;
	by?: UserTagDiarySortByFilter;
	page?: number | `${number}`;
};

// /<userSlug>/tag/<tagSlug>/reviews/

export type UserTagReviewsSortByFilter = UserReviewsSortByFilter;

export type UserTagReviewsHrefArgs = {
	by?: UserTagReviewsSortByFilter; // default is by added (when reviewed)
	page?: number | `${number}`;
};

// /<userSlug>/tag/<tagSlug>/lists/

export type UserTagListsSortByFilter = ListsSortByFilter;

export type UserTagListsHrefArgs = {
	by?: UserTagListsSortByFilter;
	page?: number | `${number}`;
};

// /<userSlug>/friends/tag/<tagSlug>/films/

export type UserFriendsTagFilmsSortByFilter = TagFilmsSortByFilter;

export type UserFriendsTagFilmsHrefArgs = TagFilmsFilters & {
	by?: UserFriendsTagFilmsSortByFilter;
};

// /<userSlug>/friends/tag/<tagSlug>/diary/

export type UserFriendsTagDiarySortByFilter = DiarySortByFilter;

export type UserFriendsTagDiaryHrefArgs = {
	by?: UserFriendsTagDiarySortByFilter;
	page?: number | `${number}`;
};

// /<userSlug>/friends/tag/<tagSlug>/reviews/

export type  UserFriendsTagReviewsSortByFilter = ReviewsSortByFilter;

export type UserFriendsTagReviewsHrefArgs = {
	by?: UserFriendsTagReviewsSortByFilter; // default is by added (when reviewed)
	page?: number | `${number}`;
};

// /<userSlug>/friends/tag/<tagSlug>/lists/

export type  UserFriendsTagListsSortByFilter = ListsSortByFilter;

export type UserFriendsTagListsHrefArgs = {
	by?: ListsSortByFilter;
	page?: number | `${number}`;
};

// /<userSlug>/following/

export type UserFollowsSortByFilter =
	SortByFilter.Name
	| SortByFilter.WhenJoined
	| SortByFilter.MostPopular;

export enum UserFollowsType {
	Followers = 'followers',
	Following = 'following',
}

export type UserFollowsHrefArgs = {
	by?: UserFollowsSortByFilter;
};



// Href

export enum HrefBaseMediaPageSlug {
	Film = 'film',
	Films = 'films',
	Lists = 'lists',
	Members = 'members',
	Reviewers = 'reviewers',
	Tag = 'tag',
	Reviews = 'reviews',
	Search = 'search',
};

export type HrefBaseSlug = HrefBaseMediaPageSlug | RoleSlug | OtherPageSlug

export type HrefParts = (
	// /film/<filmSlug>/
	(
		{
			base: HrefBaseMediaPageSlug.Film;
			filmSlug: string;
		} & (
			{}
			| ({subroute: (FilmHrefSubroute.Crew | FilmHrefSubroute.Details | FilmHrefSubroute.Genres | FilmHrefSubroute.Releases);})
			| ({subroute: FilmHrefSubroute.Similar;}
				& SimilarToFilmHrefArgs)
			| ({subroute: FilmHrefSubroute.Themes;}
				& FilmThemesHrefArgs)
			| ({subroute: FilmHrefSubroute.Nanogenres;}
				& FilmNanogenresHrefArgs)
			| ({subroute: FilmHrefSubroute.Members;}
				& FilmMembersHrefArgs)
			| ({subroute: FilmHrefSubroute.Fans;})
			| ({subroute: FilmHrefSubroute.Likes;}
				& FilmLikesHrefArgs)
			| ({subroute: FilmHrefSubroute.Reviews;}
				& FilmReviewsHrefArgs)
			| ({subroute: FilmHrefSubroute.Lists;}
				& FilmListsHrefArgs)
		)
	)
	// /films/
	| (
		({base: HrefBaseMediaPageSlug.Films;}
			& FilmsHrefArgs)
	)
	// /lists/
	| (
		({base: HrefBaseMediaPageSlug.Lists;}
			& ListsHrefArgs)
	)
	// /members/
	| (
		{
			base: HrefBaseMediaPageSlug.Members;
		} & (
			({membersType?: undefined}
				& MembersHrefArgs)
			| ({membersType: MembersType.HQ}
				& HQMembersHrefArgs)
		)
	)
	// /reviewers/
	| (
		({base: HrefBaseMediaPageSlug.Reviewers;}
			& ReviewersHrefArgs)
	)
	// /tag/<tagSlug>/
	| (
		{
			base: HrefBaseMediaPageSlug.Tag;
			tagSlug: string;
		} & (
			| ({tagsType?: (TagsType.Films | undefined);}
				& TagFilmsHrefArgs)
			| ({tagsType: TagsType.Diary;}
				& TagDiaryHrefArgs)
			| ({tagsType: TagsType.Reviews;}
				& TagReviewsHrefArgs)
			| ({tagsType: TagsType.Lists;}
				& TagListsHrefArgs)
		)
	)
	// /reviews/
	| (
		{base: HrefBaseMediaPageSlug.Reviews;}
			& ReviewsHrefArgs
	)
	// /search/
	| (
		({base: HrefBaseMediaPageSlug.Search;}
			& SearchHrefArgs)
	)
	// /<roleType>/<personSlug>/
	| (
		({
			base: RoleSlug;
			personSlug: string;
		} & RolePersonHrefArgs)
	)
	// /<2012...>/
	| (
		{
			yearInReview: number | `${number}`;
			remainingHref?: string;
		}
	)
	// /<other>/
	| (
		{
			base: OtherPageSlug;
			remainingHref?: string;
		}
	)
	// /<userSlug>/
	| (
		{
			userSlug: string;
		} & (
			{}
			// /<userSlug>/films/
			| ({base: UserHrefBaseSlug.Films}
				& (
					({subroute?: undefined;}
						& UserFilmsHrefArgs)
					| ({subroute: UserFilmsHrefSubroute.Diary;}
						& UserDiaryHrefArgs)
					| ({subroute: UserFilmsHrefSubroute.Reviews;}
						& UserReviewsHrefArgs)
				))
			// /<userSlug>/film/<filmSlug>/
			| (
				{
					friends?: undefined;
					base: UserHrefBaseSlug.Film;
					filmSlug: string;
				} & (
					{viewingSubroute?: UserFilmViewingSubroute}
					| ({subroute: UserFilmSubroute.Activity;})
					| ({subroute: UserFilmSubroute.Diary;}
						& UserFilmDiaryHrefArgs)
					| ({subroute: UserFilmSubroute.Reviews;}
						& UserFilmReviewsHrefArgs)
					| ({subroute: UserFilmSubroute.Lists;}
						& UserFilmListsHrefArgs)
					| ({subroute: UserFilmSubroute.Likes;}
						& (
							({likesType: UserFilmLikesType.Reviews;}
								& UserFilmLikedReviewsHrefArgs)
							| ({likesType: UserFilmLikesType.Lists;}
								& UserFilmLikedListsHrefArgs)
						)
					)
					| ({
						viewingId: number | `${number}`
						viewingSubroute?: UserFilmViewingSubroute;
					})
				)
			)
			// /<userSlug>/friends/film/<filmSlug>/
			| (
				{
					friends: true;
					base: UserHrefBaseSlug.Film;
					filmSlug: string;
				} & (
					({subroute?: undefined}
						& UserFriendsFilmMembersHrefArgs)
					| ({subroute: UserFriendsFilmSubroute.Fans})
					| ({subroute: UserFriendsFilmSubroute.Likes}
						& UserFriendsFilmLikesHrefArgs)
					| ({subroute: UserFriendsFilmSubroute.Reviews}
						& UserFriendsFilmReviewsHrefArgs)
					| ({subroute: UserFriendsFilmSubroute.Lists}
						& UserFriendsFilmListsHrefArgs)
				)
			)
			// /<userSlug>/stories/
			| ({base: UserHrefBaseSlug.Stories}
				& UserStoriesHrefArgs)
			// /<userSlug>/activity/
			| ({
				base: UserHrefBaseSlug.Activity;
				activityType?: UserActivityType;
			})
			// /<userSlug>/watchlist/
			| ({base: UserHrefBaseSlug.Watchlist;}
				& UserWatchlistHrefArgs)
			// /<userSlug>/lists/
			| ({base: UserHrefBaseSlug.Lists;}
				& UserListsHrefArgs)
			// /<userSlug>/list/<listSlug>/
			| (
				({
					base: UserHrefBaseSlug.List;
					listSlug: string;
				} & ListHrefArgs)
			)
			// /<userSlug>/likes/
			| (
				{
					base: UserHrefBaseSlug.Likes;
				} & (
					{likesType?: undefined}
					| ({likesType: UserLikesType.Films}
						& UserLikedFilmsHrefArgs)
					| ({likesType: UserLikesType.Reviews}
						& UserLikedReviewsHrefArgs)
					| ({likesType?: UserLikesType.Lists}
						& UserLikedListsHrefArgs)
				)
			)
			// /<userSlug>/tags/
			| (
				{
					base: UserHrefBaseSlug.Tags;
				} & (
					({tagsType?: (TagsType.Films | undefined);}
						& UserTagsHrefArgs)
					| ({tagsType: TagsType.Diary;}
						& UserTagsHrefArgs)
					| ({tagsType: TagsType.Reviews;}
						& UserTagsHrefArgs)
					| ({tagsType: TagsType.Lists;}
						& UserTagsHrefArgs)
				)
			)
			// /<userSlug>/tag/<tagSlug>/
			| (
				{
					friends?: undefined;
					base: UserHrefBaseSlug.Tag;
					tagSlug: string;
				} & (
					({tagsType?: TagsType.Films;}
						& UserTagFilmsHrefArgs)
					| ({tagsType: TagsType.Diary;}
						& UserTagDiaryHrefArgs)
					| ({tagsType: TagsType.Reviews;}
						& UserTagReviewsHrefArgs)
					| ({tagsType: TagsType.Lists;}
						& UserTagListsHrefArgs)
				)
			)
			// /<userSlug>/friends/tag/<tagSlug>/
			| (
				{
					friends: true;
					base: UserHrefBaseSlug.Tag;
					tagSlug: string;
				} & (
					({tagsType?: TagsType.Films;}
						& UserFriendsTagFilmsHrefArgs)
					| ({tagsType: TagsType.Diary;}
						& UserFriendsTagDiaryHrefArgs)
					| ({tagsType: TagsType.Reviews;}
						& UserFriendsTagReviewsHrefArgs)
					| ({tagsType: TagsType.Lists;}
						& UserFriendsTagListsHrefArgs)
				)
			)
			// /<userSlug>/followers/
			| ({base: UserHrefBaseSlug.Followers}
				& UserFollowsHrefArgs
			)
			// /<userSlug>/following/
			| ({base: UserHrefBaseSlug.Following}
				& UserFollowsHrefArgs
			)
			// /<userSlug>/stats/
			| ({base: UserHrefBaseSlug.Stats})
		)
	)
) | {
	root: true
};



export enum HrefFilterSlug {
	Popular = 'popular',
	For = 'for',
	Rated = 'rated',
	Upcoming = 'upcoming',
	Decade = 'decade',
	Year = 'year',
	Like = 'like',
	In = 'in',
	Genre = 'genre',
	Nanogenre = 'nanogenre',
	Theme = 'theme',
	MiniTheme = 'mini-theme',
	On = 'on',
	With = 'with',
	By = 'by',
	Size = 'size',
	Page = 'page'
};
export const HrefFilterSlugs = Object.values(HrefFilterSlug);
export const HrefFilterSlugsSet = new Set(HrefFilterSlugs);

export const hrefFilterSlugToKey = (slug: string): string => {
	if(slug == HrefFilterSlug.MiniTheme) {
		return 'minitheme';
	}
	return slug as (keyof HrefFilterProps);
};

export type HrefFilterProps =
HrefSortOrPopularFilterProps<SortByFilter> & {
	for?: number | `${number}`;
	rated?: RatingFilter;
} & HrefTimespanFilterProps & {
	like?: string;
	in?: string;
	genre?: GenreFilter;
	nanogenre?: string;
	theme?: string;
	minitheme?: string;
	on?: StreamingServiceSlug;
	with?: RoleFilter;
	// by: SortByFilter
	size?: SizeSlug;
	page?: number | `${number}`;
};
