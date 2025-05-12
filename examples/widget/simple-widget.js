// Example of a simple Rift widget that connects to a wallet
import { rift } from 'rift-js';

// Alternative import from widget namespace
// import { rift } from 'rift-js/widget';

async function initializeWidget() {
	try {
		// Connect to the wallet
		const instance = await rift();

		// Show connected status
		document.getElementById('status').textContent = 'Connected';

		// Get and display user address
		const address = await instance.getUserAddress();
		document.getElementById('address').textContent = address;

		// Setup event handlers
		setupEventHandlers(instance);

		// Setup UI buttons
		setupButtons(instance);
	} catch (error) {
		document.getElementById('status').textContent = 'Failed to connect';
		console.error('Connection error:', error);
	}
}

function setupEventHandlers(instance) {
	// Listen for transaction events
	instance.on('tx:submitted', () => {
		document.getElementById('txStatus').textContent = 'Transaction submitted...';
	});

	instance.on('tx:success', (txId) => {
		document.getElementById('txStatus').textContent = `Transaction confirmed: ${txId}`;
		document.getElementById('txId').textContent = txId;
	});

	instance.on('tx:error', (error) => {
		document.getElementById('txStatus').textContent = 'Transaction failed';
		console.error('Transaction error:', error);
	});

	instance.on('error', (error) => {
		document.getElementById('error').textContent = error.message;
		console.error('Error:', error);
	});
}

function setupButtons(instance) {
	// Query button (execute script)
	document.getElementById('queryButton').addEventListener('click', async () => {
		try {
			const result = await instance.query({
				cadence: `
          access(all) fun main(): String {
            return "Hello from Cadence script!"
          }
        `,
				args: [],
			});

			document.getElementById('scriptResult').textContent = JSON.stringify(result);
		} catch (error) {
			document.getElementById('error').textContent = error.message;
		}
	});

	// Mutate button (submit transaction)
	document.getElementById('mutateButton').addEventListener('click', async () => {
		try {
			document.getElementById('txStatus').textContent = 'Preparing transaction...';

			await instance.mutate({
				cadence: `
          transaction {
            prepare(signer: AuthAccount) {
              log("Hello from Rift transaction!")
            }
          }
        `,
				args: [],
			});

			// The tx:submitted and tx:success events will update the UI
		} catch (error) {
			document.getElementById('txStatus').textContent = 'Transaction failed';
			document.getElementById('error').textContent = error.message;
		}
	});
}

// Initialize when the page loads
window.addEventListener('DOMContentLoaded', initializeWidget);
