// Example of wallet implementation that supports Rift widgets
import { wallet } from 'rift-js';

// Alternative import using more specific components
// import {
//   RiftDetector,
//   IframeInjector,
//   createContextMessage,
//   createScriptResultMessage,
//   createTransactionResultMessage,
//   createErrorMessage,
//   ERROR_CODES,
//   NETWORKS
// } from 'rift-js/wallet';

// Mock user data (in a real wallet, this would come from the wallet's state)
const mockUserData = {
	address: '0x1234567890abcdef',
	network: wallet.NETWORKS.FLOW_TESTNET,
};

function initializeRiftSupport() {
	// Create registry for tracking injected iframes
	const iframeRegistry = new Map();

	// Create a detector for finding Rift links
	const detector = new wallet.RiftDetector({
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
	const injector = new wallet.IframeInjector({
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
					const contextMessage = wallet.createContextMessage(mockUserData.address, mockUserData.network);
					iframe.contentWindow.postMessage(contextMessage, '*');
					console.log('Sent context to Rift widget:', contextMessage);
				} else if (data.type === 'rift:intent' && data.action === 'getUserAddress') {
					// Simple address request
					const contextMessage = wallet.createContextMessage(mockUserData.address, mockUserData.network);
					iframe.contentWindow.postMessage(contextMessage, '*');
				} else if (data.type === 'rift:intent' && data.action === 'query') {
					// Execute the script (mock implementation)
					const result = await mockExecuteScript(data.payload);

					// Send back the script result
					const resultMessage = wallet.createScriptResultMessage(result);
					iframe.contentWindow.postMessage(resultMessage, '*');
					console.log('Sent script result to Rift widget:', resultMessage);
				} else if (data.type === 'rift:intent' && data.action === 'mutate') {
					// Show a confirmation dialog to the user (mock implementation)
					const confirmed = await mockConfirmTransaction(data.payload);

					if (confirmed) {
						// Mock transaction submission
						const txId = await mockSubmitTransaction(data.payload);

						// Send successful result
						const resultMessage = wallet.createTransactionResultMessage('success', txId);
						iframe.contentWindow.postMessage(resultMessage, '*');
						console.log('Sent transaction success to Rift widget:', resultMessage);
					} else {
						// User rejected
						const errorMessage = wallet.createErrorMessage(
							wallet.ERROR_CODES.USER_REJECTED,
							'User rejected the transaction',
						);
						iframe.contentWindow.postMessage(errorMessage, '*');
						console.log('Sent rejection to Rift widget:', errorMessage);
					}
				} else {
					console.warn('Unknown message type or action:', data);
				}
			} catch (error) {
				// Send error back to the widget
				const errorMessage = wallet.createErrorMessage(wallet.ERROR_CODES.UNKNOWN_ERROR, error.message);
				iframe.contentWindow.postMessage(errorMessage, '*');
				console.error('Error handling Rift message:', error);
			}
		});
	}

	// Mock function to execute a Cadence script (in a real wallet, this would use FCL)
	async function mockExecuteScript(payload) {
		console.log('Executing script with payload:', payload);

		// Simulate processing time
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Return a mock result based on the script
		if (payload.cadence.includes('main(): String')) {
			return 'Hello from the wallet!';
		} else if (payload.cadence.includes('UFix64')) {
			return '100.0';
		} else {
			return { status: 'SUCCESS' };
		}
	}

	// Mock function to confirm a transaction with the user
	async function mockConfirmTransaction(payload) {
		console.log('Asking user to confirm transaction:', payload);

		// In a real wallet, this would show a UI prompt
		// For demo purposes, we'll just return true
		return true;
	}

	// Mock function to submit a transaction (in a real wallet, this would use FCL)
	async function mockSubmitTransaction(payload) {
		console.log('Submitting transaction with payload:', payload);

		// Simulate processing time
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Generate a mock transaction ID
		return '0x' + Math.random().toString(16).substring(2, 10);
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

// Cleanup when the page unloads
window.addEventListener('beforeunload', () => {
	if (riftSupport && riftSupport.cleanup) {
		riftSupport.cleanup();
	}
});
