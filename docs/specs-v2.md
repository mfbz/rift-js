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
| **Rift Registry**          | A curated list of verified Rift Frame domains that display a checkmark badge for enhanced user trust and security.           |

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
| Frame tries to escape sandbox  | `sandbox="allow-scripts"` on every iframe. |
| Phishing via untrusted domains | Frame must be manually injected by user with confirmation. Trusted origins may be allow‑listed.                             |
| Mixed‑content blocking         | `rift://` **must** resolve to `https://`.                                                             |
| Direct wallet API calls        | All communication is over `window.postMessage`; wallet exposes no HTTP endpoints.                     |
| Malicious frame impersonation  | Registry-based verification system displays checkmark badges for approved domains.                     |

### Registry-Based Verification

To enhance user trust and security, Rift-compatible wallets maintain a curated **Rift Registry** of verified domains. When a frame is loaded from a verified domain:

- A **✓ Verified** checkmark badge appears next to the frame
- Users can easily identify trusted applications
- Registry inclusion requires security audit and community approval
- Verified frames get streamlined injection (reduced confirmation steps)

**Verification Criteria:**
- Open-source codebase with security audit
- Established developer reputation
- Community governance approval
- Adherence to Rift security best practices

**User Experience:**
```
┌─────────────────────────────────┐
│ ✓ Verified │ MyDApp Quiz Frame  │ ← Checkmark for registry domains
└─────────────────────────────────┘
vs.
┌─────────────────────────────────┐
│ ⚠️ Unverified │ Unknown Frame   │ ← Warning for non-registry domains  
└─────────────────────────────────┘
```

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

All messages are JSON‑RPC 2.0‑style objects sent via `postMessage`.

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

### Smart Download Links

`https://rift.app/download?rift=<URL‑encoded rift://…>`

If the wallet is installed, the extension overrides the link and injects the live frame. Otherwise, the page shows OS‑specific download buttons and social‑card metadata so platforms like Twitter render an attractive preview.

#### Critical: OpenGraph Metadata

**OpenGraph metadata is essential** for Rift Frame success. When users share Smart Download Links on social platforms, rich metadata ensures:

- **Better Discovery**: Attractive previews increase click-through rates
- **Clear Intent**: Users understand what they're interacting with before clicking
- **Professional Appearance**: Well-formatted cards build trust and credibility
- **Platform Compatibility**: Consistent display across Twitter, Discord, Telegram, etc.

**Required OpenGraph Tags:**

```html
<meta property="og:title" content="Mint Exclusive NFT Collection" />
<meta property="og:description" content="Claim your limited edition NFT from the Cosmic Cats collection. Only 100 remaining!" />
<meta property="og:image" content="https://mydapp.com/preview.jpg" />
<meta property="og:url" content="https://rift.app/download?rift=rift://mydapp.com/mint" />
<meta property="og:type" content="website" />

<!-- Rift-specific metadata -->
<meta property="rift:action" content="mint" />
<meta property="rift:category" content="nft" />
<meta property="rift:network" content="flow" />
```

**Best Practices:**
- **Image**: Use 1200x630px images for optimal display
- **Title**: Keep under 60 characters, be action-oriented
- **Description**: 150-160 characters, clearly explain the value proposition
- **URL**: Always use the Smart Download Link, not the raw `rift://` URI

**Impact on User Experience:**

Without proper metadata:
```
🔗 https://rift.app/download?rift=rift%3A%2F%2F...
Generic link preview with no context
```

With rich metadata:
```
┌─────────────────────────────────────────┐
│ 🖼️  [Attractive NFT Preview Image]      │
│                                         │
│ 🎯 Mint Exclusive NFT Collection        │
│ 📝 Claim your limited edition NFT...    │
│ 🔗 rift.app                            │
└─────────────────────────────────────────┘
```

### Link Generator

Rift's website provides a utility to turn any Rift URI into a compliant Smart Download Link, complete with OpenGraph tags.

## Summary

- **Rift Protocol** turns any web page into a canvas for on-chain actions
- **Rift-compatible Wallet** listens for `rift://` URIs in text content and injects secure iframes
- **rift-js** gives developers full access to wallet functions from inside the iframe
