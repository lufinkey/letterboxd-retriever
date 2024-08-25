
import * as letterboxd from './index';

(async () => {
	console.log("Testing getFilmHrefFromTmdbID");
	try {
		const result = await letterboxd.getFilmHrefFromTmdbID('1226578');
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();
	console.log();
	console.log();

	console.log("Testing getFilmInfo with slug");
	try {
		const result = await letterboxd.getFilmInfo({slug:'legend'});
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
		const result = await letterboxd.getUserFollowingFeed('luisfinke');
		console.log(JSON.stringify(result, null, '\t'));
		if(!result.end) {
			console.log("\nPage 2:");
			const result2 = await letterboxd.getUserFollowingFeed('luisfinke', {
				after: result.items[result.items.length-1].id,
				csrf: result.csrf
			});
			console.log(JSON.stringify(result2, null, '\t'));
		}
	} catch(error) {
		console.error(error);
	}
})();
