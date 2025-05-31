# Rift Protocol V2

A complete reference for embedding secure, onchain interactions inside any webpage, social post, or message using the `rift://` URI scheme.

## Overview

**Rift Protocol** lets developers ship mini‑dapps as **iframes** that a Rift‑compatible wallet injects directly into the host page. Users interact with the frame exactly where they discover it, with no redirects, pop‑ups, or copy‑pasting addresses.

### Key components**

| Component                  | Definition                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Rift URI**               | A `rift://` scheme link that encodes the location of a Rift Frame and resolves to a secure `https://` iframe URL at runtime. |
| **Rift Frame**             | The hosted HTML/JS interface loaded in the injected iframe. It drives on‑chain actions via `rift‑js`.                           |
| **Rift‑Compatible Wallet** | Browser extension that detects Rift URIs, injects frames, signs transactions, and mediates access to the blockchain.         |
| **rift‑js SDK**            | Lightweight TypeScript library running inside the frame and the wallet for handshake, RPC, and event hooks.                                 |
| **Smart Download Link**    | A fallback `https://` link embedding a Rift URI, guiding users to install the wallet and resuming the original intent.       |
| **Bridge**                 | The `window.postMessage` channel that carries JSON‑RPC messages between wallet and frame.                                    |

## How It Works

1. **Author** hosts a Rift Frame (`https://mydapp.com/frame`).
2. Anyone can share `rift://mydapp.com/frame?ref=abc` or a smart link in a tweet, blog post or any web context.
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

**Example**

```
rift://mydapp.com/rift/quiz?rift-height=tall
```

### Parameters (prefix `rift-`)

| Name           | Values      | Purpose               |                    |                       |
| -------------- | ----------- | --------------------- | ------------------ | --------------------- |
| `rift-height`  | \`compact   |  standard             |  tall\`            | Preset iframe height. |
| `rift-color`   | 6‑digit HEX | Theme accent colour.  |                    |                       |

### Customizing Rift Frames

Rift URIs support special parameters with the `rift-` prefix to customize how frames are displayed:

#### Frame Height

The `rift-height` parameter controls the height of the injected frame:

```
rift://mydapp.com/rift/quiz?rift-height=tall&ref=abc
```

**Height presets**

| Preset   | Pixels | Typical use                    |
| -------- | ------ | ------------------------------ |
| compact  | 200 px | Confirmations, small forms     |
| standard | 350 px | Default size                   |
| tall     | 500 px | Complex UIs (like NFT minting or mini-games) |

Set via `?rift-height=tall`.

#### Frame Color

Control the color of your Rift Frame using the `rift-color` parameter:

```
rift://app.example.com/mint?rift-color=4E71FF
```

**Colour accent**

Set via `?rift-color=4E71FF` (hex RGB).

## Security Model

| Threat                         | Mitigation                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Frame tries to escape sandbox  | `sandbox="allow-scripts allow-forms allow-popups allow-downloads allow-same-origin"` on every iframe. |
| Phishing via untrusted domains | Frame must be manually injected by user with confirmation. Trusted origins may be allow‑listed.                             |
| Mixed‑content blocking         | `rift://` **must** resolve to `https://`.                                                             |
| Direct wallet API calls        | All communication is over `window.postMessage`; wallet exposes no HTTP endpoints.                     |

## Developer SDK for Rift Frames

Rift developers include the `rift-js` library in their iframe UI. It provides:

### 1. **Handshake** (auto-connect)

```ts
import { rift } from 'rift-js';

const api = await rift();
console.log('Connected address:', api.address);
```

### 2. **Submit Transactions**

```ts
await api.submitTransaction({
  cadence: 'transaction { execute { log("Hello") } }',
  args: []
});
```

### 3. **Request Data or Permissions**

```ts
const balance = await api.getBalance();
```

### 4. **Event Hooks**

```ts
api.on('tx:submitted', (txId) => console.log('Submitted', txId));
api.on('tx:success', (txId) => showSuccess(txId));
api.on('error', (err) => console.error(err));
```

## Frame ↔ Wallet Messaging

All messages are JSON‑RPC 2.0‑style objects sent via `postMessage`.

### Frame → Wallet

```json
{ "type": "rift:handshake" }
{ "type": "rift:intent", "action": "submitTransaction", "payload": { … } }
```

### Wallet → Frame

```json
{ "type": "rift:context", "address": "0x123", "network": "flow-testnet" }
{ "type": "rift:mutateResult", "status": "success", "txId": "abc…" }
{ "type": "rift:error", "message": "User rejected transaction." }
```

## Onboarding Without a Wallet

### Smart Download Links

`https://rift.app/download?rift=<URL‑encoded rift://…>`

If the wallet is installed, the extension overrides the link and injects the live frame. Otherwise, the page shows OS‑specific download buttons and social‑card metadata so platforms like Twitter render an attractive preview.

### Link Generator

Rift’s website provides a utility to turn any Rift URI into a compliant Smart Download Link, complete with OpenGraph tags.

## Summary

- **Rift Protocol** turns any web page into a canvas for on-chain actions
- **Rift-compatible Wallet** listens for `rift://` URIs in text content and injects secure iframes
- **rift-js** gives developers full access to wallet functions from inside the iframe
