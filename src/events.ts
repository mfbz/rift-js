import { EventCallback, EventHandlers } from './types';
import { RiftEventType } from './rift';

/**
 * Simple event emitter implementation for Rift events
 */
export class EventEmitter {
	private handlers: EventHandlers = {};

	/**
	 * Subscribe to an event
	 * @param event The event type to subscribe to
	 * @param callback The callback function
	 */
	public on(event: RiftEventType, callback: EventCallback): void {
		if (!this.handlers[event]) {
			this.handlers[event] = [];
		}

		this.handlers[event].push(callback);
	}

	/**
	 * Unsubscribe from an event
	 * @param event The event type to unsubscribe from
	 * @param callback The callback function to remove
	 */
	public off(event: RiftEventType, callback: EventCallback): void {
		if (!this.handlers[event]) {
			return;
		}

		this.handlers[event] = this.handlers[event].filter((handler) => handler !== callback);
	}

	/**
	 * Emit an event with data
	 * @param event The event type to emit
	 * @param data The data to pass to subscribers
	 */
	public emit(event: RiftEventType, data?: any): void {
		if (!this.handlers[event]) {
			return;
		}

		this.handlers[event].forEach((callback) => {
			try {
				callback(data);
			} catch (error) {
				console.error(`Error in event handler for ${event}:`, error);
			}
		});
	}
}
