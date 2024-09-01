
export type LetterboxdError = Error & {
	statusCode?: number;
};

export const letterboxdError = (statusCode: number, message: string) => {
	const lbError: LetterboxdError = new Error(message);
	lbError.statusCode = statusCode;
	return lbError;
};
