# 🌀 Rift-JS

`rift-js` is the official JavaScript/TypeScript SDK and documentation hub for the Rift Protocol, a lightweight, embeddable Web3 action framework.

It enables iframe-based components (called **Rift Frames**) to securely communicate with Rift-compatible wallets (like **Harpoon 🪝**) to perform Flow blockchain interactions.

## 🌐 What Is a Rift Frame?

A **Rift Frame** is a secure, sandboxed iframe injected into any webpage via a `rift://` URI.

- Hosts a developer-controlled UI (like minting, voting, claiming, mini-games)
- Rendered by wallets like Harpoon 🪝
- Uses `rift-js` to:

  - Retrieve the user's Flow address
  - Submit Flow transactions
  - Execute read-only Cadence scripts

Share `rift://` URIs anywhere (tweets, blogs, sites). If the user has Harpoon installed, it will recognize and render the interaction securely in-place.

Here's some bonus rift frames for development:

rift://localhost:3000?rift-color=4E71FF
    
rift://localhost:3000/nft-minter?rift-height=tall&rift-color=8200db

rift://localhost:3000/nft-carousel?rift-height=standard

rift://localhost:3000/token-buy?rift-height=compact&rift-color=00EF8B

## 🗂 Project Structure

```
rift-js/
├── src/                    # SDK source (TypeScript)
├── starters/               # Starter projects
├── docs/                   # Protocol documentation
├── rollup.config.js        # Build config
├── tsconfig.json
├── package.json
├── LICENSE
└── README.md
```

## 🚀 Installation

```bash
npm install
npm run build
```

To use in a frame:

```bash
npm add rift-js
```

## 🔧 How to Use `rift-js` in a Frame

### 🔗 Connect & Submit a Transaction

```ts
// Import from the root namespace
import { rift } from 'rift-js';

const instance = await rift();
console.log('Connected address:', await instance.getUserAddress());

// Submit a transaction
await instance.mutate({
	cadence: `transaction { execute { log("hello") } }`,
	args: [],
});
```

### 📘 Execute a Read-Only Script

```ts
// Execute a script
const result = await instance.query({
	cadence: `access(all) fun main(): String { return "Hello from script" }`,
	args: [],
});
console.log('Script result:', result);
```

### 📡 Subscribe to Events

```ts
rift.on('tx:success', (txId) => console.log('Tx confirmed', txId));
rift.on('error', (err) => alert(err.message));
```

## 🔧 How to Use `rift-js` in a Wallet

Wallet developers need to detect Rift URIs and handle communication with Rift Frames:

```ts
import { wallet } from 'rift-js';

// Create a detector to find Rift URIs in the page text content
const detector = new wallet.RiftDetector({
	onRiftUriFound: (node, riftUrl, range) => {
		// Handle the URI (e.g., ask user for permission)
		handleRiftUri(node, riftUrl, range);
	}
});

// Start scanning for Rift URIs
detector.start();

// Create an injector to replace URIs with iframes
const injector = new wallet.IframeInjector();

function handleRiftUri(node, riftUrl, range) {
	// Get the parent element for replacement
	const targetElement = range.commonAncestorContainer.parentElement;
	
	// Inject the iframe
	const iframe = injector.injectFrame(targetElement, riftUrl);
	
	// Set up message handling for this iframe
	if (iframe) {
		setupMessageHandler(iframe);
	}
}

function setupMessageHandler(iframe) {
	window.addEventListener('message', (event) => {
		// Check if message is from our iframe
		if (event.source !== iframe.contentWindow) return;
		
		const data = event.data;
		
		if (!data || !data.type || !data.type.startsWith('rift:')) return;
		
		// Handle handshake
		if (data.type === 'rift:handshake') {
			// Send context with user's address and network
			const contextMessage = wallet.createContextMessage(
				'0x1234567890abcdef', // User's address
				wallet.NETWORKS.FLOW_TESTNET // Current network
			);
			iframe.contentWindow.postMessage(contextMessage, '*');
		}
		
		// Handle query (script execution)
		else if (data.type === 'rift:intent' && data.action === 'query') {
			// Execute the script using wallet infrastructure
			executeScript(data.payload).then(result => {
				const resultMessage = wallet.createScriptResultMessage(result);
				iframe.contentWindow.postMessage(resultMessage, '*');
			}).catch(error => {
				const errorMessage = wallet.createErrorMessage(
					wallet.ERROR_CODES.INVALID_PAYLOAD,
					error.message
				);
				iframe.contentWindow.postMessage(errorMessage, '*');
			});
		}
		
		// Handle mutate (transaction submission)
		else if (data.type === 'rift:intent' && data.action === 'mutate') {
			// Submit transaction using wallet infrastructure
			submitTransaction(data.payload).then(txId => {
				const resultMessage = wallet.createTransactionResultMessage(
					'success',
					txId
				);
				iframe.contentWindow.postMessage(resultMessage, '*');
			}).catch(error => {
				const errorMessage = wallet.createErrorMessage(
					wallet.ERROR_CODES.USER_REJECTED,
					error.message
				);
				iframe.contentWindow.postMessage(errorMessage, '*');
			});
		}
	});
}
```

## 🔁 Lifecycle of a Rift Frame

```text
User opens a page containing a rift:// URI in text
        ↓
Harpoon detects the URI and prompts for approval
        ↓
User approves
        ↓
Harpoon injects a secure iframe
        ↓
Rift Frame loads and calls rift()
        ↓
Handshake via postMessage
        ↓
Harpoon responds with address and network context
        ↓
Frame triggers tx or script intent
        ↓
Harpoon signs, submits, or evaluates
        ↓
Frame receives result or error event
```

## 🧠 Error Handling

Use the `'error'` event to catch runtime issues:

```ts
rift.on('error', (err) => {
	console.error('Rift error:', err.message);
});
```

### Common Error Codes

| Code                 | Description                    |
| -------------------- | ------------------------------ |
| `user_rejected`      | User denied the action         |
| `wallet_unavailable` | Wallet extension not detected  |
| `timeout`            | No response from wallet bridge |
| `invalid_payload`    | Cadence or args were malformed |
| `connection_error`   | Failed to connect to wallet    |
| `not_initialized`    | SDK not properly initialized   |
| `unknown_error`      | Unexpected error occurred      |
| `not_supported`      | Feature not supported          |

## 🌍 rift:// URI Format

A `rift://` URI maps to an HTTPS iframe:

```
rift://domain.com/path?query=value
```

Injected as:

```html
<iframe src="https://domain.com/path?query=value" sandbox="..." />
```

### Frame Customization

You can customize how your Rift Frame appears using special parameters with the `rift-` prefix:

#### Frame Height

Control the height of your Rift Frame using the `rift-height` parameter:

```
rift://app.example.com/mint?rift-height=tall&tokenId=123
```

Available height presets:
- `compact` (200px) - For simple confirmations or minimal UI
- `standard` (350px) - Default size for most interactions  
- `tall` (500px) - For complex interfaces like NFT minting

#### Frame Color

Control the color of your Rift Frame using the `rift-color` parameter:

```
rift://app.example.com/mint?rift-color=4E71FF
```

## 🔐 Protocol Implementation

### Core Concepts

#### 1. Rift Bridge

The `RiftBridge` class handles communication between the iframe and the wallet using `window.postMessage()`. It implements:

- Handshake protocol
- Transaction submission
- Script execution
- Address retrieval

#### 2. Event System

The `EventEmitter` provides a simple event system for:

- Transaction lifecycle events (`tx:submitted`, `tx:success`, `tx:error`)
- Error handling
- Context updates

#### 3. URI Detection

The `RiftDetector` helps with finding `rift://` URIs in webpage text content.

#### 4. Iframe Injection

The `IframeInjector` handles creating and managing secure iframes for Rift content.

### Usage Examples

#### Basic Connection

```ts
import { rift } from 'rift-js';

async function connectToWallet() {
	const instance = await rift();
	const address = await instance.getUserAddress();
	console.log('Connected to address:', address);
}
```

#### Transaction Submission

```ts
import { rift } from 'rift-js';

async function sendTransaction() {
	const instance = await rift();

	try {
		const txId = await instance.mutate({
			cadence: `transaction { execute { log("Hello from Rift!") } }`,
			args: [],
		});

		console.log('Transaction submitted:', txId);
	} catch (error) {
		console.error('Transaction failed:', error);
	}
}
```

#### Script Execution

```ts
import { rift } from 'rift-js';

async function runScript() {
	const instance = await rift();

	const result = await instance.query({
		cadence: `access(all) fun main(): String { return "Hello from script" }`,
		args: [],
	});

	console.log('Script result:', result);
}
```

#### Event Handling

```ts
import { rift } from 'rift-js';

async function setupEventHandlers() {
	const instance = await rift();

	instance.on('ready', (data) => {
		console.log('Connected to wallet:', data.address);
	});

	instance.on('tx:submitted', () => {
		console.log('Transaction submitted to wallet');
	});

	instance.on('tx:success', (txId) => {
		console.log('Transaction confirmed on chain:', txId);
	});

	instance.on('error', (error) => {
		console.error('Error:', error.message);
	});
}
```

#### URI Detection

```ts
import { RiftDetector } from 'rift-js';

const detector = new RiftDetector({
	onRiftUriFound: (node, riftUrl, range) => {
		console.log(`Found Rift URI: ${riftUrl}`);
		
		// You can create clickable elements
		const wrapper = document.createElement('span');
		wrapper.className = 'rift-uri-highlight';
		range.surroundContents(wrapper);
		
		wrapper.addEventListener('click', () => {
			console.log('URI clicked:', riftUrl);
		});
	}
});

detector.start();
```

#### Iframe Injection

```ts
import { RiftDetector, IframeInjector } from 'rift-js';

const injector = new IframeInjector({
	defaultHeight: '400px',
	onIframeInjected: (iframe, element) => {
		console.log('Iframe injected:', iframe);
	},
});

const detector = new RiftDetector({
	onRiftUriFound: (node, riftUrl, range) => {
		// Create a container at that position
		const container = document.createElement('div');
		range.surroundContents(container);
		injector.injectFrame(container, riftUrl);
	}
});

detector.start();
```

### Message Protocol

Communication between the iframe and wallet happens through `postMessage`:

#### Iframe → Wallet

```ts
// Handshake to initialize connection
{ type: 'rift:handshake' }

// Transaction request
{
  type: 'rift:intent',
  action: 'submitTransaction',
  payload: { cadence: '...', args: [] }
}

// Script execution
{
  type: 'rift:intent',
  action: 'executeScript',
  payload: { cadence: '...', args: [] }
}
```

#### Wallet → Iframe

```ts
// Context with user address
{
  type: 'rift:context',
  address: '0x123',
  network: 'flow-testnet'
}

// Transaction result
{
  type: 'rift:mutateResult',
  status: 'success',
  txId: 'abc...'
}

// Script result
{
  type: 'rift:queryResult',
  result: "..."
}

// Error message
{
  type: 'rift:error',
  code: 'user_rejected',
  message: 'User rejected transaction'
}
```

## 🧪 Local Testing

1. Start the example frame:

```bash
cd starters/next-starter
npm install
npm run dev
npm run open:test-rift
```

2. It will open the test-rift page linking to next-starter uris
3. Harpoon detects the link, injects the iframe, and connects

### 📡 Using HTTP for Development

By default, rift:// URLs are converted to https:// when injected as iframes. For local development or testing environments, you can enable HTTP instead:

```js
import { setConfig } from 'rift-js';

// Enable HTTP for local development
setConfig({
  useHttpForLocalDevelopment: true,
});
```

This will convert all `rift://` URLs to `http://` instead of `https://` when `useHttpForLocalDevelopment` is enabled.

## 🤝 Contributing

We welcome contributions!

1. Fork the repo
2. Create a new branch
3. Implement changes or additions
4. Open a pull request with context

## 📄 License

MIT
