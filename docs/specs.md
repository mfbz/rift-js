# Rift Protocol

## Overview

**Rift Protocol** enables secure, embeddable, onchain web3 interactions using **iframe-based components** injected directly into webpages by a Rift-compatible wallet.

At its core:

- A **Rift** is a URI using the `rift://` scheme pointing to a hosted iframe UI.
- A **Rift-compatible wallet** detects these URIs in webpage content and injects the container that manages Rift frame visibility.
- A shared TypeScript SDK (**rift-js**) handles the communication between the injected iframe and the wallet.

The protocol provides a seamless way to embed mini dapps into any digital context, tweets, blogs, websites, or social bios, requiring no native integration.

## How It Works

1. A developer hosts a Rift Frame at a public HTTPS URL.
2. The developer shares a `rift://` URI (like in a tweet or on their site or in any webpage).
3. When a user with a Rift-compatible wallet visits a page containing that URI:
   - The wallet detects it in text content
   - It injects a container that manages Rift frame visibility and injection
4. The iframe uses `rift-js` to automatically connect with the wallet
5. It can then:
   - Retrieve the user's address
   - Query the chain
   - Submit transactions
   - Display status updates, balances, etc.

## Rift URI Format

Rift URIs follow the `rift://` scheme:

```
rift://[host]/[path][?query]
```

### Example

```
rift://mydapp.com/rift/quiz?ref=abc
```

### Notes

- **Only HTTPS iframe URLs are allowed:** `rift://` is resolved to `https://...`
- The wallet injects an iframe pointing to `https://mydapp.com/rift/quiz?ref=abc`
- URIs can be detected in text content

### Customizing Rift Frames

Rift URIs support special parameters with the `rift-` prefix to customize how frames are displayed:

#### Frame Height

The `rift-height` parameter controls the height of the injected frame:

```
rift://mydapp.com/rift/quiz?rift-height=tall&ref=abc
```

Available height presets:
- `compact` (200px) - For simple confirmations or minimal UI
- `standard` (350px) - Default size for most interactions (used if no height is specified)
- `tall` (500px) - For complex interfaces like NFT minting

#### Frame Color

Control the color of your Rift Frame using the `rift-color` parameter:

```
rift://app.example.com/mint?rift-color=4E71FF
```

## URI Detection

The wallet detects `rift://` URIs in text content:

- Any text node containing a `rift://` URI pattern is detected
- This detection approach enables Rift URIs to work in tweets, posts, and messages
- Seamless injection of text URIs into interactive frames

## Security Model

- **User must approve injection** the first time a Rift is detected from an origin
- **Trusted domains** can be allowlisted for auto-injection
- **All iframes are sandboxed**:

  ```html
  sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-same-origin"
  ```

- **CSP headers** are enforced to avoid iframe escape attempts
- **No cookies, localStorage, or cross-frame DOM access** is allowed

## rift-js: Developer SDK for Rift Frames

Rift developers include the `rift-js` library in their iframe UI. It provides:

### 1. **Handshake** (auto-connect)

```
import { rift } from 'rift-js';

const rift = await rift();
console.log('Connected address:', rift.address);
```

### 2. **Submit Transactions**

```
await rift.submitTransaction({
  cadence: 'transaction { execute { log("Hello") } }',
  args: []
});
```

### 3. **Request Data or Permissions**

```
const balance = await rift.getBalance();
```

### 4. **Event Hooks**

```
rift.on('tx:submitted', (txId) => console.log('Submitted', txId));
rift.on('tx:success', (txId) => showSuccess(txId));
rift.on('error', (err) => console.error(err));
```

## Frame-to-Wallet Messaging (Internal Spec)

Communication occurs over `window.postMessage`:

### Frame → Wallet

```
{
  type: 'rift:handshake'
}
{
  type: 'rift:intent', action: 'submitTransaction', payload: { ... }
}
```

### Wallet → Frame

```
{
  type: 'rift:context', address: '0x123', network: 'flow-testnet'
}
{
  type: 'rift:mutateResult', status: 'success', txId: 'abc...'
}
{
  type: 'rift:error', message: 'User rejected transaction.'
}

```

## Critical Considerations & Limitations

Although Rift Protocol is highly buildable and modern browser-compatible, there are important technical and security considerations to be aware of when building or integrating with `rift://`-based workflows.

### Frame Sandboxing

**Risk:** Frames can be used to exfiltrate data, manipulate UX, or escape into parent context if not locked down.

**Solution:**

- All injected Rifts are injected with an iframe with:

  ```html
  sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-same-origin"
  ```

- Disable access to `document.cookie`, `localStorage`, etc.
- All wallet data (address, tx functions) is passed via `rift-js` and `postMessage` only.

### Mixed Content Blocking (HTTPS Enforcement)

**Risk:** Browsers block loading `http://` content in an `https://` context, breaking injection for non-secure Rift URLs.

**Solution:**

- All `rift://` URIs must resolve to **`https://` URLs only**
- The wallet will reject or warn on insecure origins

### CORS and Cross-Origin Access

**Risk:** Frames cannot directly call wallet APIs due to browser CORS policies.

**Solution:**

- Frames should **not call wallet APIs directly**
- Use `rift-js` which wraps postMessage-based RPC
- Wallet should not expose HTTP endpoints, all comms go through message channel

### Domain Trust & Injection Approval

**Risk:** Malicious or unverified domains could attempt phishing via injected iframes.

**Solution:**

- The wallet prompts the user before injecting any new origin
- Users can "Always trust" or "Deny" domains
- Optionally implement a public Rift Provider Registry

### Mobile Limitations

**Risk:** Browser extensions and the protocol are currently desktop-only

**Solution:**

- Document as desktop-first protocol
- Plan future mobile support via:
  - `wallet://` deep linking
  - Native wallet app with embedded browser

### UX Safeguards

**Concerns:**

- Multiple Rifts on one page could overwhelm or degrade performance
- Bad iframe UIs may mimic wallet interfaces

**Solution:**

- Inject only 1 Rift at a time unless all are pre-approved
- Wallet overlays should always indicate source domain
- Consider lazy-loading or iframe collapse for offscreen Rifts

### Text URI Detection Performance

**Risk:** Scanning the entire page for Rift URIs could cause performance issues on large pages

**Solution:**

- Use efficient tree traversal via browser's API
- Implement smart filtering to skip script/style tags
- Throttle scanning during rapid page updates
- Only process text nodes that contain "rift://" substring

## Error Handling

When using the Rift protocol, developers should be prepared to handle various error scenarios:

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

### Error Handling Example

```ts
rift.on('error', (err) => {
  console.error(`Error (${err.code}): ${err.message}`);
  
  switch(err.code) {
    case 'user_rejected':
      // Handle user rejection
      break;
    case 'wallet_unavailable':
      // Suggest wallet installation
      break;
    default:
      // General error handling
  }
});
```

## Summary

- **Rift Protocol** turns any web page into a canvas for on-chain actions
- **Rift-compatible Wallet** listens for `rift://` URIs in text content and injects secure iframes
- **rift-js** gives developers full access to wallet functions from inside the iframe
