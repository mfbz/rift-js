/**
 * Configuration options for the Rift protocol
 */
export interface RiftConfig {
	/**
	 * Whether to use HTTP instead of HTTPS for local development or testing
	 * This should only be enabled in development environments
	 */
	useHttpForLocalDevelopment: boolean;

	/**
	 * List of hosts that should be treated as local/development hosts
	 * Default: localhost, 127.0.0.1, and hosts with .local TLD
	 */
	localHosts: string[];
}

// Default configuration values
const defaultConfig: RiftConfig = {
	useHttpForLocalDevelopment: false,
	localHosts: ['localhost', '127.0.0.1'],
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

/**
 * Check if a host is considered a local/development host
 */
export function isLocalHost(host: string): boolean {
	if (!host) return false;

	const lowerHost = host.toLowerCase();

	// Check if the host is in the localHosts list
	if (currentConfig.localHosts.includes(lowerHost)) {
		return true;
	}

	// Check if the host has a .local TLD
	if (lowerHost.endsWith('.local')) {
		return true;
	}

	return false;
}
