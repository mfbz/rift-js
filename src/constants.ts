// Message timeout
export const MESSAGE_TIMEOUT = 30000;

// Error codes
export const ERROR_CODES = {
	USER_REJECTED: 'user_rejected',
	WALLET_UNAVAILABLE: 'wallet_unavailable',
	TIMEOUT: 'timeout',
	INVALID_PAYLOAD: 'invalid_payload',
	CONNECTION_ERROR: 'connection_error',
	NOT_INITIALIZED: 'not_initialized',
	UNKNOWN_ERROR: 'unknown_error',
	NOT_SUPPORTED: 'not_supported',
};

// URI scheme
export const RIFT_URI_SCHEME = 'rift://';
export const RIFT_HTTPS_PREFIX = 'https://';

// Event channels
export const RIFT_EVENTS = {
	READY: 'ready',
	TX_SUBMITTED: 'tx:submitted',
	TX_SUCCESS: 'tx:success',
	TX_ERROR: 'tx:error',
	ERROR: 'error',
};
