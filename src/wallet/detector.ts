import { RIFT_URI_SCHEME } from '../constants';
import { parseRiftUri } from '../utils';
import { getProtocolPrefix } from './helpers';

/**
 * Options for Rift URI detection
 */
export interface RiftDetectorOptions {
	/** Function to call when a Rift URI is found - node is the text node containing the URI,
	 * riftUrl is the complete URI including all query parameters, and range covers the exact text span */
	onRiftUriFound?: (node: Node, riftUrl: string, range: Range) => void;
	/** Only scan specific elements */
	rootElement?: HTMLElement;
	/** Throttle text scanning to reduce performance impact (ms) */
	scanThrottle?: number;
}

/**
 * Default conversion function to transform rift:// URLs to https:// or http:// (for local development) ones
 */
export function convertRiftUrl(url: string): string {
	if (!url.startsWith(RIFT_URI_SCHEME)) {
		return url;
	}

	const parsed = parseRiftUri(url);
	if (!parsed) {
		return url;
	}

	const prefix = getProtocolPrefix(parsed.host);

	// Create clean URL without rift-specific parameters
	let cleanUrl = `${prefix}${parsed.host}${parsed.path}`;

	// Add application parameters if any exist
	const appParamsEntries = Object.entries(parsed.appParams);
	if (appParamsEntries.length > 0) {
		const searchParams = new URLSearchParams();
		appParamsEntries.forEach(([key, value]) => {
			searchParams.append(key, value);
		});
		cleanUrl += `?${searchParams.toString()}`;
	}

	return cleanUrl;
}

/**
 * Regular expression to find rift:// URIs in text
 * Matches rift:// followed by domain, optional path, and all query parameters including rift-specific ones
 * The global flag ensures we find all instances in a text block
 */
const RIFT_URI_REGEX =
	/(rift:\/\/[a-zA-Z0-9][-a-zA-Z0-9.]*[a-zA-Z0-9](?::\d+)?(?:\/[-a-zA-Z0-9()@:%_\+.~#?&//=]*)?(?:\?[-a-zA-Z0-9()@:%_\+.~#?&//=]*)?)/g;

/**
 * Detector class for finding Rift protocol URIs in a webpage in text nodes.
 * The detector can find multiple Rift URIs even when they appear in the same text node,
 * whether they're on the same line or separated by newlines.
 */
export class RiftDetector {
	private options: RiftDetectorOptions;
	private observer: MutationObserver | null = null;
	private scanTimeout: number | null = null;
	private pendingScan = false;
	private processedTextNodes = new WeakMap<Node, Set<string>>();

	constructor(options: RiftDetectorOptions = {}) {
		this.options = {
			rootElement: document.body,
			scanThrottle: 500, // Default throttle of 500ms
			...options,
		};
	}

	/**
	 * Start scanning for Rift URIs
	 */
	public start(): void {
		// Initial scan
		this.scanForRiftUris();

		// Setup observer for DOM changes
		this.observer = new MutationObserver((mutations) => {
			let shouldScan = false;

			for (const mutation of mutations) {
				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					shouldScan = true;
					break;
				} else if (mutation.type === 'characterData') {
					shouldScan = true;
					break;
				}
			}

			if (shouldScan && !this.pendingScan) {
				this.scheduleScan();
			}
		});

		this.observer.observe(this.options.rootElement || document.body, {
			childList: true,
			subtree: true,
			characterData: true,
		});
	}

	/**
	 * Schedule a throttled scan to avoid performance issues
	 */
	private scheduleScan(): void {
		if (this.scanTimeout !== null) {
			window.clearTimeout(this.scanTimeout);
		}

		this.pendingScan = true;
		this.scanTimeout = window.setTimeout(() => {
			this.scanForRiftUris();
			this.pendingScan = false;
			this.scanTimeout = null;
		}, this.options.scanThrottle);
	}

	/**
	 * Stop scanning for Rift URIs
	 */
	public stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}

		if (this.scanTimeout !== null) {
			window.clearTimeout(this.scanTimeout);
			this.scanTimeout = null;
			this.pendingScan = false;
		}

		// Clear the processed nodes cache
		this.processedTextNodes = new WeakMap<Node, Set<string>>();
	}

	/**
	 * Scan the document for Rift URIs using TreeWalker for efficiency
	 * This scans text nodes only
	 */
	private scanForRiftUris(): void {
		if (!this.options.onRiftUriFound) return;

		// Scan text nodes
		this.scanTextNodes();
	}

	/**
	 * Scan for Rift URIs in text nodes
	 */
	private scanTextNodes(): void {
		if (!this.options.onRiftUriFound) return;

		const rootElement = this.options.rootElement || document.body;
		const treeWalker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, {
			acceptNode: (node) => {
				// Skip text nodes that are in script, style
				const parent = node.parentElement;
				if (!parent) return NodeFilter.FILTER_REJECT;

				if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') {
					return NodeFilter.FILTER_REJECT;
				}

				// Only accept nodes that might contain our URIs
				return node.textContent && node.textContent.includes('rift://')
					? NodeFilter.FILTER_ACCEPT
					: NodeFilter.FILTER_REJECT;
			},
		});

		let textNode: Text | null;
		while ((textNode = treeWalker.nextNode() as Text | null)) {
			const text = textNode.textContent || '';

			// Get or create a set of processed URIs for this text node
			let processedUris = this.processedTextNodes.get(textNode);
			if (!processedUris) {
				processedUris = new Set<string>();
				this.processedTextNodes.set(textNode, processedUris);
			}

			// Find all matches in the text
			let match;
			// Reset lastIndex to ensure we start from the beginning
			RIFT_URI_REGEX.lastIndex = 0;

			// We use exec in a loop to find all matches, which handles both
			// multiple URIs on the same line and URIs separated by newlines
			while ((match = RIFT_URI_REGEX.exec(text)) !== null) {
				const riftUri = match[0];
				const startIndex = match.index;
				const endIndex = startIndex + riftUri.length;

				// Generate a unique key for this URI occurrence in this text node
				const uriKey = `${riftUri}:${startIndex}`;

				// Skip if we've already processed this specific URI at this position
				if (processedUris.has(uriKey)) {
					continue;
				}

				// Mark as processed
				processedUris.add(uriKey);

				// Create range for this match
				const range = document.createRange();
				range.setStart(textNode, startIndex);
				range.setEnd(textNode, endIndex);

				// Notify handler
				this.options.onRiftUriFound!(textNode, riftUri, range);
			}
		}
	}

	/**
	 * Reset the detector's state, including processed nodes cache
	 */
	public reset(): void {
		this.stop();
		this.processedTextNodes = new WeakMap<Node, Set<string>>();
	}

	/**
	 * Manually scan a specific text node for Rift URIs
	 * @param textNode The text node to scan
	 * @returns Array of found Rift URIs
	 */
	public scanNode(textNode: Text): string[] {
		if (!this.options.onRiftUriFound || !textNode.textContent) {
			return [];
		}

		const foundUris: string[] = [];
		const text = textNode.textContent;

		// Find all matches in the text
		let match;
		// Reset lastIndex to ensure we start from the beginning
		RIFT_URI_REGEX.lastIndex = 0;

		// We use exec in a loop to find all matches
		while ((match = RIFT_URI_REGEX.exec(text)) !== null) {
			const riftUri = match[0];
			const startIndex = match.index;
			const endIndex = startIndex + riftUri.length;

			// Create range for this match
			const range = document.createRange();
			range.setStart(textNode, startIndex);
			range.setEnd(textNode, endIndex);

			// Notify handler
			this.options.onRiftUriFound(textNode, riftUri, range);
			foundUris.push(riftUri);
		}

		return foundUris;
	}
}
