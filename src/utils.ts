/**
 * Check if the current environment is a Rift frame
 * (running in an iframe injected by a wallet)
 */
export function isRiftFrame(): boolean {
	try {
		return window.self !== window.top && window.top !== null;
	} catch (e) {
		// If we can't access window.top due to cross-origin restrictions,
		// we're likely in an iframe
		return true;
	}
}

/**
 * Check if the `window.rift` global is available (injected by wallet)
 */
export function isRiftSupported(): boolean {
	return typeof window !== 'undefined' && 'rift' in window;
}

/**
 * Helper to generate a unique message ID
 */
export function generateMessageId(): string {
	return Math.random().toString(36).substring(2, 15);
}

/**
 * Convert an error to a standardized error object
 */
export function normalizeError(error: unknown): { code: string; message: string } {
	if (error instanceof Error) {
		return {
			code: 'unknown_error',
			message: error.message,
		};
	}

	if (typeof error === 'string') {
		return {
			code: 'error',
			message: error,
		};
	}

	return {
		code: 'unknown_error',
		message: 'An unknown error occurred',
	};
}

/**
 * Parse a Rift URI into its components
 */
export function parseRiftUri(uri: string): {
	host: string;
	path: string;
	query: string;
	riftParams: Record<string, string>;
	appParams: Record<string, string>;
} | null {
	if (!uri.startsWith('rift://')) {
		return null;
	}

	// Remove the rift:// prefix
	const withoutPrefix = uri.substring(7);

	// Extract the host
	const hostEnd = withoutPrefix.indexOf('/');
	const host = hostEnd === -1 ? withoutPrefix : withoutPrefix.substring(0, hostEnd);

	// Extract the path and query
	let path = '';
	let query = '';

	if (hostEnd === -1) {
		path = '';

		// Check if there's a query in the host portion
		const queryIndex = host.indexOf('?');
		if (queryIndex !== -1) {
			query = host.substring(queryIndex);
		}
	} else {
		const pathAndQuery = withoutPrefix.substring(hostEnd);
		const queryStart = pathAndQuery.indexOf('?');

		if (queryStart === -1) {
			path = pathAndQuery;
			query = '';
		} else {
			path = pathAndQuery.substring(0, queryStart);
			query = pathAndQuery.substring(queryStart);
		}
	}

	// Extract and separate rift-specific parameters from application parameters
	const riftParams: Record<string, string> = {};
	const appParams: Record<string, string> = {};

	if (query && query.length > 1) {
		// Remove the leading '?' character
		const queryString = query.substring(1);
		const searchParams = new URLSearchParams(queryString);

		searchParams.forEach((value, key) => {
			if (key.startsWith('rift-')) {
				const riftKey = key.substring(5); // Remove 'rift-' prefix
				riftParams[riftKey] = value;
			} else {
				appParams[key] = value;
			}
		});
	}

	return {
		host,
		path,
		query,
		riftParams,
		appParams,
	};
}
