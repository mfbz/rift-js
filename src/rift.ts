import { RiftBridge } from './bridge';
import { EventCallback } from './types';

/**
 * Intent types sent from iframe to wallet
 */
export type RiftIntentType = 'rift:handshake' | 'rift:intent';

/**
 * Response types sent from wallet to iframe
 */
export type RiftResponseType = 'rift:context' | 'rift:mutateResult' | 'rift:queryResult' | 'rift:error';

/**
 * Intent actions that can be requested
 */
export type RiftAction = 'getUserAddress' | 'query' | 'mutate';

/**
 * Event types emitted by the Rift instance
 */
export type RiftEventType = 'ready' | 'tx:submitted' | 'tx:success' | 'tx:error' | 'error';

/**
 * Base message interface
 */
export interface RiftMessage {
	type: RiftIntentType | RiftResponseType;
}

/**
 * Handshake message to initiate connection
 */
export interface RiftHandshakeMessage extends RiftMessage {
	type: 'rift:handshake';
}

/**
 * Intent message for actions
 */
export interface RiftIntentMessage extends RiftMessage {
	type: 'rift:intent';
	action: RiftAction;
	payload: any;
}

/**
 * Context message from wallet with user info
 */
export interface RiftContextMessage extends RiftMessage {
	type: 'rift:context';
	address: string;
	network: string;
}

/**
 * Transaction result message
 */
export interface RiftResultMessage extends RiftMessage {
	type: 'rift:mutateResult';
	status: 'success' | 'error';
	txId: string;
}

/**
 * Script result message
 */
export interface RiftScriptResultMessage extends RiftMessage {
	type: 'rift:queryResult';
	result: any;
}

/**
 * Error message
 */
export interface RiftErrorMessage extends RiftMessage {
	type: 'rift:error';
	code: string;
	message: string;
}

/**
 * Main Rift class exposing public methods
 */
export class Rift {
	private bridge: RiftBridge;

	constructor(bridge: RiftBridge) {
		this.bridge = bridge;
	}

	/**
	 * Get the user's Flow address
	 * @returns Promise that resolves to the user's address
	 */
	public async getUserAddress(): Promise<string> {
		return this.bridge.getUserAddress();
	}

	/**
	 * Network-aware wrapper for executing read-only Cadence scripts
	 * Uses the network context from the wallet connection
	 * @param options Script options with Cadence code and arguments
	 * @returns Promise that resolves to the result of the script
	 */
	public async query(options: { cadence: string; args: any[] }): Promise<any> {
		return this.bridge.query(options);
	}

	/**
	 * Network-aware wrapper for submitting transactions
	 * Uses the network context from the wallet connection
	 * @param options Transaction options with Cadence code and arguments
	 * @returns Promise that resolves to the transaction ID
	 */
	public async mutate(options: { cadence: string; args: any[] }): Promise<string> {
		return this.bridge.mutate(options);
	}

	/**
	 * Subscribe to an event
	 * @param event Event type to subscribe to
	 * @param callback Callback function to call when the event is emitted
	 */
	public on(event: RiftEventType, callback: EventCallback): void {
		this.bridge.on(event, callback);
	}

	/**
	 * Unsubscribe from an event
	 * @param event Event type to unsubscribe from
	 * @param callback Callback function to remove
	 */
	public off(event: RiftEventType, callback: EventCallback): void {
		this.bridge.off(event, callback);
	}
}

/**
 * Create and connect to a Rift instance
 * @returns Promise that resolves to a connected Rift instance
 */
export async function rift(): Promise<Rift> {
	const bridge = new RiftBridge();
	await bridge.connect();
	return new Rift(bridge);
}
