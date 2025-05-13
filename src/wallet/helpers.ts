import { RiftContextMessage, RiftErrorMessage, RiftResultMessage, RiftScriptResultMessage } from '../rift';
import { RIFT_HTTPS_PREFIX, RIFT_HTTP_PREFIX } from '../constants';
import { getConfig, isLocalHost } from '../config';

/**
 * Get the appropriate protocol prefix (http:// or https://) based on configuration
 * and the target host
 *
 * @param host The host to check
 * @returns The appropriate protocol prefix
 */
export function getProtocolPrefix(host: string): string {
	const config = getConfig();
	const useHttp = config.useHttpForLocalDevelopment && isLocalHost(host);
	return useHttp ? RIFT_HTTP_PREFIX : RIFT_HTTPS_PREFIX;
}

/**
 * Helper to create a context message
 * @param address User's Flow address
 * @param network Current network (flow-mainnet, flow-testnet, etc.)
 * @returns Context message that can be sent to a Rift frame
 */
export function createContextMessage(address: string, network: string): RiftContextMessage {
	return {
		type: 'rift:context',
		address,
		network,
	};
}

/**
 * Helper to create an error message
 * @param code Error code
 * @param message Error message
 * @returns Error message that can be sent to a Rift frame
 */
export function createErrorMessage(code: string, message: string): RiftErrorMessage {
	return {
		type: 'rift:error',
		code,
		message,
	};
}

/**
 * Helper to create a script result message
 * @param result Script execution result
 * @returns Script result message that can be sent to a Rift frame
 */
export function createScriptResultMessage(result: any): RiftScriptResultMessage {
	return {
		type: 'rift:queryResult',
		result,
	};
}

/**
 * Helper to create a transaction result message
 * @param status Transaction status
 * @param txId Transaction ID
 * @returns Transaction result message that can be sent to a Rift frame
 */
export function createTransactionResultMessage(status: 'success' | 'error', txId: string): RiftResultMessage {
	return {
		type: 'rift:mutateResult',
		status,
		txId,
	};
}
