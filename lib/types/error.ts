
export type ErrorCode_Http = `LETTERBOXD:HTTP${number}`;
export type ErrorCode_ErrorPage = 'LETTERBOXD:ERRORPAGE';
export type ErrorCode = ErrorCode_Http | ErrorCode_ErrorPage;

export type LetterboxdError = Error & {
	code?: ErrorCode;
	statusCode?: number;
	description?: string;
};

export const letterboxdHttpError = (statusCode: number, message: string) => {
	const lbError: LetterboxdError = new Error(message);
	lbError.code = `LETTERBOXD:HTTP${statusCode}`;
	lbError.statusCode = statusCode;
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
