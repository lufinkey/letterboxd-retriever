
import * as letterboxd from './index';

(async () => {
	console.log("Testing getFilmInfo with slug");
	try {
		const result = await letterboxd.getFilmInfo({slug:'twisters'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();

	console.log("Testing getFilmInfo with href");
	try {
		const result = await letterboxd.getFilmInfo({href:'/film/twisters'});
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
	console.log();

	console.log("Testing getUserFollowingFeed");
	try {
		const result = await letterboxd.getUserFollowingFeed('luisfinke');
		console.log(JSON.stringify(result, null, '\t'));
	} catch(error) {
		console.error(error);
	}
})();
