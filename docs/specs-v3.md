# Rift Protocol V3

A complete reference for embedding secure, on-chain interactions inside any webpage, social post, or message using the `rift://` URI scheme.

## Overview

**Rift Protocol** enables developers to ship mini‑dapps called **Rift Wave** injected by a Rift-compatible wallet. Users interact directly where they discover the dApp with no redirects, no pop-ups, and no copy-pasting addresses.

**V3 Update**: Rift is now **built on top of Flow’s FCL Frame Protocol**, extending it for automatic wallet connection, secure transaction tagging, and full compatibility with `@onflow/fcl` tooling.

## Key Components

| Component                  | Definition                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Rift URI**               | A `rift://` scheme link that encodes the location of a Rift Wave and resolves to a secure `https://` URL at runtime.      |
| **Rift Wave**             | The hosted website endpoint loaded inside a sandboxed iframe. Communicates securely with the wallet via FCL Frame extensions.     |
| **Rift-Compatible Wallet** | Browser extension that detects Rift URIs, injects Rift Waves, auto-connects wallet, and mediates transaction signing.                 |
| **@onflow/rift SDK**       | Thin wrapper around `@onflow/fcl`, preconfigured for Rift Waves: auto-wallet connect, in-memory session, and metadata injection. |
| **Smart Download Link**    | A fallback `https://` link embedding a Rift URI, guiding users to install the wallet and resuming the original intent.            |
| **Bridge**                 | `window.postMessage` channel carrying JSON-RPC 2.0 messages between wallet and frame, extended with Rift metadata.                |
| **Rift Registry**          | Curated list of verified Rift Wave domains displaying badges for enhanced user trust and security.                               |

## How It Works

1. **Author** hosts a Rift Wave website endpoint (e.g., `https://mydapp.com/rift-wave`).
2. Share `rift://mydapp.com/rift-wave` in tweets, blog posts, or other channels.
3. When a Rift-compatible wallet detects the URI:
   * It fetches the HTML page, extracting:
     * **CSP headers** for security validation.
     * **OpenGraph metadata** for title, description, and preview image.
     * **Rift-specific metadata** from `<meta property="rift:*">` tags for frame configuration.
   * The wallet shows a dedicated Rift Wave preview UI.
   * Upon user approval, a sandboxed iframe is injected to load the Rift Wave.
   * The wallet sends an auto-connect message (`RIFT_INIT`) with the user's wallet address and related configuration.
4. Inside the iframe, `@onflow/rift` configures FCL automatically:
   * Preloads the user session.
   * Uses in-memory storage (no localStorage).
   * Injects `rift` metadata into all queries and transactions.
5. The developer builds the dApp using standard `fcl` methods, transparently enhanced for Rift.

## Rift URI Format

```
rift://[host]/[path]
```

Example:

```
riff://mydapp.com/rift/quiz
```

## Metadata Extraction

When fetching the Rift Wave URL, the wallet extracts:

### OpenGraph Metadata

```html
<meta property="og:title" content="Mint Exclusive NFT Collection" />
<meta property="og:description" content="Claim your limited edition NFT!" />
<meta property="og:image" content="https://mydapp.com/preview.jpg" />
```

Used to display rich previews in the wallet UI.

### Rift-Specific Metadata

```html
<meta property="rift:height" content="standard" />
<meta property="rift:color" content="#ff0000" />
```

| Property            | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `rift:height`       | Preset iframe height: `compact`, `standard`, `tall`        |
| `rift:color`        | Theme accent color in HEX format                           |

If Rift-specific metadata is not available, the wallet can fallback to query parameters if provided.

## Security Model

| Threat                         | Mitigation                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| Frame tries to escape sandbox  | `sandbox="allow-scripts"` on every iframe.                                           |
| Phishing via untrusted domains | Trusted registry domains get badges. Others require manual injection confirmation.   |
| Mixed-content blocking         | `rift://` must resolve to secure `https://`.                                         |
| Wallet API access              | All via `postMessage`, no direct HTTP access to wallet.                             |
| Code injection attacks         | Strong CSP headers are recommended.                                                  |
| Origin spoofing                | `rift` metadata is embedded in all FCL interactions identifying frame origin and ID. |

### Content Security Policy (CSP)

For enhanced security, Rift Waves **should** implement Content Security Policy headers. While optional, frames with proper CSP headers receive additional security indicators in the wallet UI.

**Recommended CSP Headers:**

```http
Content-Security-Policy: default-src 'self'; script-src 'self';
```

- **`default-src 'self'`**: Sets the default policy for all resource types (images, stylesheets, fonts, etc.) to only allow loading from the same origin as the document. This prevents loading any external resources unless explicitly overridden by more specific directives.

- **`script-src 'self'`**: Specifically restricts JavaScript execution to only scripts served from the same origin. This blocks:
  - Inline `<script>` tags
  - `eval()` and similar dynamic code execution
  - External script loading from CDNs or other domains
  - `javascript:` URLs

**Security Impact:**
- **Cross-Site Scripting (XSS) Prevention**: Even if an attacker injects malicious HTML, they cannot execute external scripts or inline JavaScript
- **Data Exfiltration Protection**: Prevents malicious scripts from loading external resources to steal user data
- **Supply Chain Attack Mitigation**: Blocks compromised external dependencies from executing

**Additional Security Benefits:**
- Prevents code injection attacks
- Restricts resource loading to same-origin
- Blocks inline scripts and eval()
- Provides defense-in-depth security

**Enhanced UI Indication:**

Frames with proper CSP headers display an additional security shield icon:

```
┌─────────────────────────────────────┐
│ ✓ Verified 🛡️ Secured │ MyDApp     │ ← Registry + CSP icons
└─────────────────────────────────────┘
vs.
┌─────────────────────────────────────┐
│ ✓ Verified │ MyDApp                 │ ← Registry only
└─────────────────────────────────────┘
vs.
┌─────────────────────────────────────┐
│ 🛡️ Secured │ MyDApp                │ ← CSP only (non-registry)
└─────────────────────────────────────┘
```

### Auto-Connect Wallet on Load

The wallet sends a `RIFT_INIT` postMessage:

```json
{
  "type": "RIFT_INIT",
  "payload": {
    "address": "0xabcdef...",
    "services": [/* fcl auth services */],
    "flowNetwork": "mainnet",
    "riftMetadata": {
      "frameId": "uuid",
      "origin": "https://dapp.com",
      "riftVersion": "1.0.0"
    }
  }
}
```

The Rift SDK preconfigures `@onflow/fcl` inside the iframe:

* Loads user address.
* Sets services.
* Uses in-memory storage.
* No user action is needed to initiate login.

### Extended Metadata for Transactions

Every FCL interaction from the frame (query, mutate) is extended:

```json
{
  "rift": {
    "frameId": "uuid",
    "origin": "https://dapp.com",
    "riftVersion": "1.0.0",
    "timestamp": 1717390927
  }
}
```

This allows the wallet to:

* Identify Rift-sourced transactions.
* Apply frame-specific security rules.
* Show UI badges ("Sent from Rift Wave").
* Validate origin and trust levels.

## Developer SDK (`@onflow/rift`)

Developers use `@onflow/rift`, a thin extension over `@onflow/fcl`.

### 1. Auto-Connect + Current User

```ts
import * as rift from '@onflow/rift';

const user = await rift.getCurrentUser().snapshot();
console.log(user.addr);
```

### 2. Query the Blockchain

```ts
import * as rift from '@onflow/rift';

const nftData = await rift.query({
  cadence: `
    query { account(address: $address) { balance } }
  `,
  args: [rift.arg(user.addr, rift.t.Address)]
});
```

### 3. Mutate (Submit Transaction)

```ts
import * as rift from '@onflow/rift';

await rift.mutate({
  cadence: `
    transaction {
      prepare(acct: AuthAccount) { log("Hello Rift!") }
    }
  `,
  args: []
});
```

### 4. Event Hooks

Developers can listen for transaction status:

```ts
import * as rift from '@onflow/rift';

rift.tx(txId).subscribe((txStatus) => console.log(txStatus));
```

## Registry-Based Verification

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
- Implementation of Content Security Policy headers (recommended)

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

## Onboarding Without a Wallet

If a user doesn’t have a Rift-compatible wallet:

* A Smart Download Link redirects them to install the wallet.
* The wallet automatically resumes the original intent after installation.

`https://rift.app/download?rift=<URL‑encoded rift://…>`
