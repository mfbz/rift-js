// Example of wallet implementation with HTTP support for local development
import { wallet, setConfig } from 'rift-js';

// Enable HTTP for local development
setConfig({
	useHttpForLocalDevelopment: true,
	// Optionally add additional hosts that should be treated as local/development
	localHosts: ['localhost', '127.0.0.1', 'my-dev-machine.local', 'test-devnet.example.com'],
});

// Mock user data (in a real wallet, this would come from the wallet's state)
const mockUserData = {
	address: '0x1234567890abcdef',
	network: 'flow-testnet',
};

function initializeRiftSupport() {
	// Create registry for tracking injected iframes
	const iframeRegistry = new Map();

	// Create a detector for finding Rift links
	const detector = new wallet.detector.RiftDetector({
		onRiftLinkFound: (element, riftUrl) => {
			// Show permission dialog to user (for demo, we auto-approve)
			console.log(`Found Rift link: ${riftUrl}`);
			const approved = true; // In a real wallet, this would be a user prompt

			if (approved) {
				handleRiftLink(element, riftUrl);
			}
		},
	});

	// Create an injector for creating iframes
	const injector = new wallet.injector.IframeInjector({
		defaultHeight: '400px',
		onIframeInjected: (iframe, originalElement) => {
			// Store reference to the iframe and original link
			iframeRegistry.set(iframe, {
				originalElement,
				url: originalElement.getAttribute('href'),
			});

			// Set up communication with this iframe
			setupMessageHandler(iframe);

			console.log('Injected iframe for Rift widget');
			// Notice that for localhost, we'll use http:// protocol instead of https://
			console.log('Iframe URL:', iframe.src);
		},
		onIframeRemoved: (iframe, originalElement) => {
			// Clean up registry
			iframeRegistry.delete(iframe);
			console.log('Removed Rift iframe');
		},
	});

	// Start scanning for Rift links
	detector.start();

	// Handle Rift link by injecting an iframe
	function handleRiftLink(element, riftUrl) {
		injector.injectFrame(element, riftUrl);
	}

	// Handle messages from Rift widgets
	function setupMessageHandler(iframe) {
		window.addEventListener('message', async (event) => {
			// Only process messages from our injected iframes
			if (event.source !== iframe.contentWindow) return;

			const data = event.data;
			if (!data || !data.type || !data.type.startsWith('rift:')) return;

			console.log('Received message from Rift widget:', data);

			try {
				// Handle different message types
				if (data.type === 'rift:handshake') {
					// Send back context with user's address and network info
					const contextMessage = wallet.helpers.createContextMessage(mockUserData.address, mockUserData.network);
					iframe.contentWindow.postMessage(contextMessage, '*');
					console.log('Sent context to Rift widget:', contextMessage);
				}
				// Other message handling...
			} catch (error) {
				console.error('Error handling Rift message:', error);
			}
		});
	}

	// Provide a way to cleanup when needed
	return {
		cleanup: () => {
			detector.stop();
			injector.removeAllFrames();
		},
	};
}

// Initialize when the page loads
let riftSupport;
window.addEventListener('DOMContentLoaded', () => {
	riftSupport = initializeRiftSupport();
});
