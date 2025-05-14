/**
 * Configuration options for the Rift protocol
 */
export interface RiftConfig {
	/**
	 * Whether to use HTTP instead of HTTPS for local development or testing
	 * This should only be enabled in development environments
	 */
	useHttpForLocalDevelopment: boolean;
}

// Default configuration values
const defaultConfig: RiftConfig = {
	useHttpForLocalDevelopment: false,
};

// Current configuration (initialized with defaults)
let currentConfig: RiftConfig = { ...defaultConfig };

/**
 * Get the current configuration
 */
export function getConfig(): RiftConfig {
	return { ...currentConfig };
}

/**
 * Update the configuration
 * @param config Partial configuration to update
 */
export function setConfig(config: Partial<RiftConfig>): void {
	currentConfig = {
		...currentConfig,
		...config,
	};
}
