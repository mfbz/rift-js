/**
 * Network-aware query options
 */
export interface QueryOptions {
	cadence: string;
	args: any[];
}

/**
 * Network-aware mutation options
 */
export interface MutateOptions {
	cadence: string;
	args: any[];
}

/**
 * Event callback function type
 */
export type EventCallback = (data: any) => void;

/**
 * Event handlers mapping
 */
export interface EventHandlers {
	[key: string]: EventCallback[];
}
