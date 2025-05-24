
import * as letterboxd from './index';
import * as lburls from './urls';

const testsToRun = process.argv.slice(2).map((testName) => testName.toLowerCase());
console.log(`tests to run = ${JSON.stringify(testsToRun)}`);

const tests: {[key:string]: any} = {
	async testGetFilmInfoWithTmdbID() {
		return await letterboxd.getFilmInfo({tmdbId: "64122"});
	},

	async testGetFilmInfoWithTmdbID2() {
		return await letterboxd.getFilmInfo({tmdbId:'1226578'});
	},

	async testGetFilmHrefFromExternalID() {
		return await letterboxd.getFilmHrefFromExternalID({tmdbId:'1226578'});
	},

	async testFailGetFilmHrefFromExternalID() {
		return await letterboxd.getFilmHrefFromExternalID({tmdbId:'2710'});
	},

	async testFailGetFilmInfo() {
		return await letterboxd.getFilmInfo({tmdbId:'2710'});
	},

	async testGetFriendsReviews() {
		const opts: letterboxd.GetFriendsReviewsOptions = {username:'luisfinke', filmSlug:'legend'};
		console.log(`\t${lburls.friendsReviewsURL(opts)}`);
		return await letterboxd.getFriendsReviews(opts);
	},

	async testGetFilmInfoWithSlug() {
		return await letterboxd.getFilmInfo({filmSlug:'legend'});
	},

	async testGetFilmInfoWithHref() {
		return await letterboxd.getFilmInfo({href:'/film/twisters'});
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

	async testGetFilmListPage() {
		return await letterboxd.getFilmListPage({href:'/darrencb/list/letterboxds-top-250-horror-films'});
	},

	async testGetFilmListDetailPage() {
		return await letterboxd.getFilmListPage({href:'/darrencb/list/letterboxds-top-250-horror-films/detail'});
	},

	async testGetSimilar() {
		const opts: letterboxd.GetSimilarFilmsOptions = {href:'/film/deadpool-wolverine'};
		console.log(`\t${lburls.similarItemsURL(opts)}`);
		return await letterboxd.getSimilar(opts);
	}
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
