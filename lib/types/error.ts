
export type ErrorCode_Http = `LETTERBOXD:HTTP${number}`;
export const ErrorCode_ErrorPage = 'LETTERBOXD:ERRORPAGE';
export type ErrorCode = ErrorCode_Http | typeof ErrorCode_ErrorPage;

export type LetterboxdError = Error & {
	code: ErrorCode;
	url: string;
	httpResponse?: Response;
	description?: string;
};

export const letterboxdHttpError = (url: string, res: Response): LetterboxdError => {
	const error = new Error(res.statusText) as LetterboxdError;
	error.code = `LETTERBOXD:HTTP${res.status}`;
	error.url = url;
	error.httpResponse = res;
	return error;
};

export const letterboxdPageError = (errorPage: ErrorPage, url: string, res: Response) => {
	let errorMessage: string;
	let errorCode: ErrorCode;
	if(res.status >= 200 && res.status < 300) {
		errorMessage = errorPage.title || "Unknown error";
		errorCode = ErrorCode_ErrorPage;
	} else {
		errorMessage = errorPage.title || res.statusText;
		errorCode = `LETTERBOXD:HTTP${res.status}`;
	}
	const error = new Error(errorMessage) as LetterboxdError;
	error.code = errorCode;
	error.url = url;
	error.httpResponse = res;
	error.description = errorPage.description;
	return error;
};

export type ErrorPage = {
	title: string;
	description: string;
};
