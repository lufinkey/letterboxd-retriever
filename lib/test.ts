
import * as letterboxd from './index';

(async () => {
	console.log("Testing getFilmHrefFromExternalID");
	try {
		const result = await letterboxd.getFilmHrefFromExternalID({tmdbId:'1226578'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	console.log("Testing failure getFilmHrefFromExternalID");
	try {
		const result = await letterboxd.getFilmHrefFromExternalID({tmdbId:'2710'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	console.log("Testing failure getFilmInfo");
	try {
		const result = await letterboxd.getFilmInfo({tmdbId:'2710'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	console.log("Testing getFriendsReviews");
	try {
		const result = await letterboxd.getFriendsReviews({username:'luisfinke', filmSlug:'legend'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	console.log("Testing getFilmInfo with slug");
	try {
		const result = await letterboxd.getFilmInfo({filmSlug:'legend'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	/*console.log("Testing getFilmInfo with href");
	try {
		const result = await letterboxd.getFilmInfo({href:'/film/twisters'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();*/

	console.log("Testing getFilmInfo with tmdbId");
	try {
		const result = await letterboxd.getFilmInfo({tmdbId:'1226578'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	console.log("Testing getUserFollowingFeed");
	try {
		let result = await letterboxd.getUserFollowingFeed('luisfinke');
		console.log(JSON.stringify(result, null, '\t'));
		/*let pageNum = 2;
		while(!result.end) {
			let nextPageToken: string | null = result.items[result.items.length-1].id
			console.log(`\nPage ${pageNum}:`);
			result = await letterboxd.getUserFollowingFeed('luisfinke', {
				after: nextPageToken,
				csrf: result.csrf
			});
			console.log(JSON.stringify(result, null, '\t'));
			pageNum++;
		}*/
	} catch(error) {
		console.error(error);
	}

	console.log("Testing getFilmListPage");
	try {
		const result = await letterboxd.getFilmListPage({href:'/darrencb/list/letterboxds-top-250-horror-films'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	console.log("Testing getSimilar");
	try {
		const result = await letterboxd.getSimilar({href:'/film/deadpool-wolverine'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	// wait
	await new Promise((resolve, reject) => {
		setTimeout(resolve, 8000);
	});
})();
