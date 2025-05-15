# Rift Protocol

## Overview

**Rift Protocol** enables secure, embeddable, on-chain Web3 interactions using **iframe-based widgets** injected directly into webpages by a Rift-compatible wallet (like **Harpoon**).

At its core:

- A **Rift** is a URI using the `rift://` scheme pointing to a hosted iframe UI.
- **Harpoon Wallet** detects these URIs in webpage text content, prompts the user, and injects the iframe.
- A shared JavaScript SDK (**rift-js**) handles the communication between the injected iframe and the wallet.

This system provides a seamless way to embed blockchain actions into any digital context, tweets, blogs, websites, or social bios, requiring no native dapp integration.

## How It Works

1. A developer hosts a UI widget at a public HTTPS URL.
2. The developer shares a `rift://` URI (like in a tweet or on their site or in any webpage).
3. When a user with **Harpoon Wallet** visits a page containing that URI:
   - Harpoon detects it in text content
   - Prompts the user
   - Injects a **sandboxed iframe** pointing to that URL
4. The iframe uses `rift-js` to automatically connect with the wallet
5. It can then:
   - Retrieve the user's address
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

## URI Detection

Harpoon detects `rift://` URIs in text content:

- Any text node containing a `rift://` URI pattern is detected
- This detection approach enables Rift URIs to work in tweets, posts, and messages
- Seamless injection of text URIs into interactive frames

## Security Model

- **User must approve injection** the first time a Rift is detected from an origin
- **Trusted domains** can be allowlisted for auto-injection
- **All iframes are sandboxed**:

  ```html
  sandbox="allow-scripts allow-forms allow-popups allow-downloads"
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

## Iframe-to-Wallet Messaging (Internal Spec)

Communication occurs over `window.postMessage`:

### Iframe → Wallet

```
{
  type: 'rift:handshake'
}
{
  type: 'rift:intent', action: 'submitTransaction', payload: { ... }
}
```

### Wallet → Iframe

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

## Harpoon Wallet

Harpoon, as the first Rift-compatible wallet, must:

- Detect `rift://` URIs on any visited page in text content
- Parse and inject iframe URL (`rift://foo.com/path` → `https://foo.com/path`)
- Prompt the user
- On approval:
  - Inject the iframe using a secured `sandbox` setup
  - Inject `window.rift` bridge to communicate with the iframe
  - Handle intent requests (tx signing, balance read, etc.)

## Example Use Case

1. Dev hosts widget at <https://quiz.mydapp.com>
2. Dev shares `rift://quiz.mydapp.com` in a tweet as text
3. User sees the URI in a tweet or on a site
4. Harpoon sees the URI → injects the iframe (after approval)
5. Iframe UI calls:

```tsx
const rift = await rift();
const result = await rift.submitTransaction({ ... });
```

6. User signs tx via Harpoon popup
7. Result passed back into the iframe via `rift:mutateResult`


## Critical Considerations & Limitations

Although Rift Protocol is highly buildable and modern browser-compatible, there are important technical and security considerations to be aware of when building or integrating with `rift://`-based workflows.

### Iframe Sandboxing

**Risk:** Iframes can be used to exfiltrate data, manipulate UX, or escape into parent context if not locked down.

**Solution:**

- All injected Rifts are injected with an iframe with:

  ```html
  sandbox="allow-scripts allow-forms allow-popups allow-downloads"
  ```

- Disable access to `document.cookie`, `localStorage`, etc.
- All wallet data (address, tx functions) is passed via `rift-js` and `postMessage` only.

### Mixed Content Blocking (HTTPS Enforcement)

**Risk:** Browsers block loading `http://` content in an `https://` context, breaking injection for non-secure Rift URLs.

**Solution:**

- All `rift://` URIs must resolve to **`https://` URLs only**
- Harpoon will reject or warn on insecure origins

### CORS and Cross-Origin Access

**Risk:** Iframes cannot directly call wallet APIs due to browser CORS policies.

**Solution:**

- Iframes should **not call Harpoon APIs directly**
- Use `rift-js` which wraps postMessage-based RPC
- Wallet should not expose HTTP endpoints, all comms go through message channel

### Domain Trust & Injection Approval

**Risk:** Malicious or unverified domains could attempt phishing via injected iframes.

**Solution:**

- Harpoon prompts the user before injecting any new origin
- Users can "Always trust" or "Deny" domains
- Optionally implement a public Rift Provider Registry

### Mobile Limitations

**Risk:** Browser extensions like Harpoon are currently desktop-only

**Solution:**

- Document as desktop-first protocol
- Plan future mobile support via:
  - `harpoon://` deep linking
  - Native Harpoon app with embedded browser

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

- Use efficient tree traversal via browser's TreeWalker API
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
- **Harpoon Wallet** listens for `rift://` URIs in text content and injects secure iframes
- **rift-js** gives developers full access to wallet functions from inside the iframe
