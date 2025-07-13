
export type ErrorCode_Http = `LETTERBOXD:HTTP${number}`;
export type ErrorCode_ErrorPage = 'LETTERBOXD:ERRORPAGE';
export type ErrorCode = ErrorCode_Http | ErrorCode_ErrorPage;

export type LetterboxdError = Error & {
	code: ErrorCode;
	url: string;
	httpResponse?: Response;
	description?: string;
};

export const letterboxdHttpError = (url: string, res: Response): LetterboxdError => {
	const lbError = new Error(res.statusText) as LetterboxdError;
	lbError.code = `LETTERBOXD:HTTP${res.status}`;
	lbError.url = url;
	lbError.httpResponse = res;
	return lbError;
};

export const letterboxdPageError = (errorPage: ErrorPage, url: string, res: Response) => {
	let errorMessage: string;
	let errorCode: ErrorCode;
	if(res.status && res.status >= 200 && res.status < 300) {
		errorMessage = errorPage.title || "Unknown error";
		errorCode = `LETTERBOXD:ERRORPAGE`;
	} else {
		errorMessage = errorPage.title || res.statusText;
		errorCode = `LETTERBOXD:HTTP${res.status}`;
	}
	const lbError = new Error(errorMessage) as LetterboxdError;
	lbError.url = url;
	lbError.httpResponse = res;
	lbError.description = errorPage.description;
	return lbError;
};

export type ErrorPage = {
	title: string;
	description: string;
};
