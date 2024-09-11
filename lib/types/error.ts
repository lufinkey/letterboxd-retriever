
export type ErrorCode_Http = `LETTERBOXD:HTTP${number}`;
export type ErrorCode_ErrorPage = 'LETTERBOXD:ERRORPAGE';
export type ErrorCode = ErrorCode_Http | ErrorCode_ErrorPage;

export type LetterboxdError = Error & {
	code?: ErrorCode;
	url?: string;
	statusCode?: number;
	description?: string;
};

export const letterboxdHttpError = (options: {url: string, statusCode: number, message: string}) => {
	const lbError: LetterboxdError = new Error(options.message);
	lbError.code = `LETTERBOXD:HTTP${options.statusCode}`;
	lbError.url = options.url;
	lbError.statusCode = options.statusCode;
	return lbError;
};

export const letterboxdPageError = (errorPage: ErrorPage) => {
	const lbError: LetterboxdError = new Error(errorPage.title);
	lbError.code = `LETTERBOXD:ERRORPAGE`;
	lbError.description = errorPage.description;
	return lbError;
};

export type ErrorPage = {
	title: string;
	description: string;
};
