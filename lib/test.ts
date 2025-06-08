
import * as letterboxd from './index';
import * as lburls from './urls';

let testsToRun = process.argv.slice(2);
console.log(`tests to run = ${testsToRun.length > 0 ? JSON.stringify(testsToRun) : "all"}`);
console.log();
testsToRun = testsToRun.map((testName) => testName.toLowerCase());

const tests: {[key:string]: any} = {
	async testGetFilmWithTmdbID() {
		return await letterboxd.getFilm({tmdbId: "64122"});
	},

	async testGetFilmWithTmdbID2() {
		return await letterboxd.getFilm({tmdbId:'1226578'});
	},

	async testGetFilmHrefFromExternalID() {
		return await letterboxd.getFilmHrefFromExternalID({tmdbId:'1226578'});
	},

	async testFailGetFilmHrefFromExternalID() {
		return await letterboxd.getFilmHrefFromExternalID({tmdbId:'2710'});
	},

	async testFailGetFilm() {
		return await letterboxd.getFilm({tmdbId:'2710'});
	},

	async testGetFriendsReviews() {
		const opts: letterboxd.GetReviewsOptions = {
			userSlug: 'luisfinke',
			filmSlug: 'legend',
			friends: true,
		};
		console.log(`\t${lburls.reviewsURL(opts)}`);
		return await letterboxd.getReviews(opts);
	},

	async testGetFilmWithSlug() {
		return await letterboxd.getFilm({filmSlug:'legend'});
	},

	async testGetFilmWithHref() {
		return await letterboxd.getFilm({href:'/film/twisters'});
	},

	userFollowingLastPage: (undefined as (letterboxd.ActivityFeedPage | undefined)),
	userFollowingPageNum: 1,

	async testGetUserFollowingFeed() {
		console.log(`Page ${this.userFollowingPageNum}`);
		if(!this.userFollowingLastPage) {
			// first page
			this.userFollowingLastPage = await letterboxd.getUserFollowingFeed('luisfinke');
		} else {
			// next page
			const nextPageToken: (string | null) = this.userFollowingLastPage.items[this.userFollowingLastPage.items.length-1].id;
			this.userFollowingLastPage = await letterboxd.getUserFollowingFeed('luisfinke', {
				after: nextPageToken,
				csrf: this.userFollowingLastPage.csrf
			});
		}
		this.userFollowingPageNum += 1;
		return this.userFollowingLastPage;
	},

	async testGetUserFollowingFeedPage2() {
		return await this.testGetUserFollowingFeed();
	},

	async testGetFilmList() {
		return await letterboxd.getFilmList({href:'/darrencb/list/letterboxds-top-250-horror-films'});
	},

	async testGetFilmListDetail() {
		return await letterboxd.getFilmList({href:'/darrencb/list/letterboxds-top-250-horror-films/detail'});
	},

	async testGetFilmListDetailWithNotes() {
		return await letterboxd.getFilmList({href:'/saffronmaeve/list/contours/detail'});
	},

	async testGetSimilarFilms() {
		const opts: letterboxd.GetSimilarFilmsOptions = {href:'/film/deadpool-wolverine'};
		console.log(`\t${lburls.similarItemsURL(opts)}`);
		return await letterboxd.getSimilarFilms(opts);
	},

	async testGetSimilarFilms2() {
		const opts: letterboxd.GetSimilarFilmsOptions = {href:'/film/mission-impossible-the-final-reckoning'};
		console.log(`\t${lburls.similarItemsURL(opts)}`);
		return await letterboxd.getSimilarFilms(opts);
	},

	async testGetRelated() {
		return await letterboxd.getFilms({href:'/films/in/the-lord-of-the-rings-collection/by/release-earliest/size/large'});
	},

	async testGetUserReviews() {
		return await letterboxd.getFilmList({href:'/criterion/films/reviews'});
	},

	async testGetUserFilms() {
		return await letterboxd.getFilmList({href:'/criterion/films'});
	},
};

(async () => {
	for(const key in tests) {
		if(!key.startsWith("test")) {
			continue;
		}
		const func = tests[key];
		if(typeof func !== 'function') {
			continue;
		}
		const testName = key.substring(4, 5).toLowerCase() + key.substring(5);
		if(testsToRun.length > 0 && !testsToRun.includes(testName.toLowerCase())) {
			continue;
		}
		try {
			console.log(`Testing ${testName}`);
			const result = await (func as Function).call(tests);
			console.log(JSON.stringify(result, null, '\t'));
		} catch(error) {
			console.error(error);
		}
		console.log();
		console.log();
		console.log();
	}
})();
