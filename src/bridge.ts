import { ERROR_CODES, MESSAGE_TIMEOUT } from './constants';
import { EventEmitter } from './events';
import {
	RiftEventType,
	RiftHandshakeMessage,
	RiftIntentMessage,
	RiftResultMessage,
	RiftScriptResultMessage,
	RiftErrorMessage,
	RiftContextMessage,
	RiftMessage,
} from './rift';
import { generateMessageId, normalizeError } from './utils';

/**
 * Bridge handles communication with the wallet via postMessage
 */
export class RiftBridge extends EventEmitter {
	private address: string | null = null;
	private network: string | null = null;
	private connected = false;

	constructor() {
		super();
		this.setupMessageListener();
	}

	/**
	 * Initialize connection with wallet
	 */
	public async connect(): Promise<void> {
		if (this.connected) {
			return;
		}

		// Ensure the DOM is fully loaded before attempting to connect
		if (document.readyState !== 'complete') {
			return new Promise((resolve) => {
				window.addEventListener(
					'load',
					() => {
						this.connect().then(resolve);
					},
					{ once: true },
				);
			});
		}

		const handshakeMsg: RiftHandshakeMessage = {
			type: 'rift:handshake',
		};

		// Send handshake message to parent
		this.sendMessage(handshakeMsg);

		// Wait for context response
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Connection timed out'));
			}, MESSAGE_TIMEOUT);

			const contextHandler = (ctx: any) => {
				clearTimeout(timeout);
				this.address = ctx.address;
				this.network = ctx.network;
				this.connected = true;
				this.emit('ready', { address: this.address, network: this.network });
				this.off('rift:context' as RiftEventType, contextHandler);
				resolve();
			};

			this.on('rift:context' as RiftEventType, contextHandler);
		});
	}

	/**
	 * Get user's Flow address
	 */
	public async getUserAddress(): Promise<string> {
		if (!this.connected) {
			await this.connect();
		}

		if (!this.address) {
			throw new Error('No address available');
		}

		return this.address;
	}

	/**
	 * Network-aware wrapper for executing read-only Cadence scripts
	 * Uses the network context from the wallet connection
	 * @param options Script options with Cadence code and arguments
	 * @returns Promise that resolves to the result of the script
	 */
	public async query(options: { cadence: string; args: any[] }): Promise<any> {
		if (!this.connected) {
			await this.connect();
		}

		const intentMsg: RiftIntentMessage = {
			type: 'rift:intent',
			action: 'query',
			payload: {
				...options,
				network: this.network,
			},
		};

		this.sendMessage(intentMsg);

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				const error = {
					code: ERROR_CODES.TIMEOUT,
					message: 'Script execution timed out',
				};
				this.emit('error', error);
				reject(new Error(error.message));
			}, MESSAGE_TIMEOUT);

			const resultHandler = (result: RiftScriptResultMessage) => {
				clearTimeout(timeout);
				this.off('rift:queryResult' as RiftEventType, resultHandler);
				resolve(result.result);
			};

			const errorHandler = (error: RiftErrorMessage) => {
				clearTimeout(timeout);
				this.off('rift:error' as RiftEventType, errorHandler);
				this.emit('error', { code: error.code, message: error.message });
				reject(new Error(error.message));
			};

			this.on('rift:queryResult' as RiftEventType, resultHandler);
			this.on('rift:error' as RiftEventType, errorHandler);
		});
	}

	/**
	 * Network-aware wrapper for submitting transactions
	 * Uses the network context from the wallet connection
	 * @param options Transaction options with Cadence code and arguments
	 * @returns Promise that resolves to the transaction ID
	 */
	public async mutate(options: { cadence: string; args: any[] }): Promise<string> {
		if (!this.connected) {
			await this.connect();
		}

		const intentMsg: RiftIntentMessage = {
			type: 'rift:intent',
			action: 'mutate',
			payload: {
				...options,
				network: this.network,
			},
		};

		this.sendMessage(intentMsg);
		this.emit('tx:submitted', null);

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				const error = {
					code: ERROR_CODES.TIMEOUT,
					message: 'Transaction timed out',
				};
				this.emit('error', error);
				reject(new Error(error.message));
			}, MESSAGE_TIMEOUT);

			const resultHandler = (result: RiftResultMessage) => {
				clearTimeout(timeout);
				this.off('rift:mutateResult' as RiftEventType, resultHandler);

				if (result.status === 'success') {
					this.emit('tx:success', result.txId);
					resolve(result.txId);
				} else {
					this.emit('tx:error', { txId: result.txId, message: 'Transaction failed' });
					reject(new Error('Transaction failed'));
				}
			};

			const errorHandler = (error: RiftErrorMessage) => {
				clearTimeout(timeout);
				this.off('rift:error' as RiftEventType, errorHandler);
				this.emit('error', { code: error.code, message: error.message });
				reject(new Error(error.message));
			};

			this.on('rift:mutateResult' as RiftEventType, resultHandler);
			this.on('rift:error' as RiftEventType, errorHandler);
		});
	}

	/**
	 * Send a message to the parent window (wallet)
	 */
	private sendMessage(message: RiftMessage): void {
		const messageWithId = {
			...message,
			id: generateMessageId(),
		};

		// Check if parent window exists and is not the same as current window
		if (window.parent && window.parent !== window) {
			try {
				window.parent.postMessage(messageWithId, '*');
			} catch (error) {
				console.error('Error sending message to parent:', error);
				this.emit('error', normalizeError(error));
			}
		} else {
			console.warn('No parent window found for postMessage');

			// For handshake messages, retry with a delay to ensure iframe is fully loaded
			if (message.type === 'rift:handshake') {
				setTimeout(() => {
					if (window.parent && window.parent !== window) {
						try {
							window.parent.postMessage(messageWithId, '*');
						} catch (error) {
							console.error('Error sending message to parent on retry:', error);
						}
					}
				}, 1000); // 1 second delay for retry
			}
		}
	}

	/**
	 * Set up the message event listener
	 */
	private setupMessageListener(): void {
		// Wait for DOM ready state if needed
		const setupListener = () => {
			window.addEventListener('message', (event) => {
				const data = event.data;

				if (!data || !data.type || !data.type.startsWith('rift:')) {
					return;
				}

				try {
					switch (data.type) {
						case 'rift:context':
							this.handleContextMessage(data as RiftContextMessage);
							break;
						case 'rift:mutateResult':
							this.emit('rift:mutateResult' as RiftEventType, data);
							break;
						case 'rift:queryResult':
							this.emit('rift:queryResult' as RiftEventType, data);
							break;
						case 'rift:error':
							this.emit('rift:error' as RiftEventType, data);
							break;
						default:
							console.warn(`Unknown message type: ${data.type}`);
					}
				} catch (error) {
					const normalizedError = normalizeError(error);
					this.emit('error', normalizedError);
				}
			});
		};

		if (document.readyState === 'loading') {
			window.addEventListener('DOMContentLoaded', setupListener);
		} else {
			setupListener();
		}
	}

	/**
	 * Handle context message from wallet
	 */
	private handleContextMessage(message: RiftContextMessage): void {
		this.address = message.address;
		this.network = message.network;
		this.connected = true;
		this.emit('rift:context' as RiftEventType, message);
	}
}
