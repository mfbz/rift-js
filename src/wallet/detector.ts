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
 *
 * It processes URIs in reverse order (last to first) within each text node to handle
 * DOM modifications that might occur when a URI is found and replaced with an iframe.
 *
 * Example usage with injector:
 * ```ts
 * const injector = new IframeInjector();
 * const detector = new RiftDetector({
 *   onRiftUriFound: (node, riftUrl, range) => {
 *     // Create container element at the location of the URI
 *     const container = document.createElement('div');
 *     range.surroundContents(container);
 *
 *     // Inject the iframe in place of the URI text
 *     injector.injectFrame(container, riftUrl);
 *   }
 * });
 *
 * detector.start();
 * ```
 */
export class RiftDetector {
	private options: RiftDetectorOptions;
	private observer: MutationObserver | null = null;
	private scanTimeout: number | null = null;
	private pendingScan = false;

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

		// Collect all text nodes first before processing
		const textNodesToProcess: Text[] = [];
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

		// First collect all text nodes with rift URIs
		let textNode: Text | null;
		while ((textNode = treeWalker.nextNode() as Text | null)) {
			textNodesToProcess.push(textNode);
		}

		// Now, for each text node, find all rift URIs and process them
		// We do this for the entire node at once before moving to the next node
		for (const node of textNodesToProcess) {
			// Skip nodes that might have been removed from the DOM
			if (!node.parentNode) continue;

			// Make a copy of the text content to work with, since the original text node
			// might be modified during processing
			const text = node.textContent || '';

			// Collect all matches from the text before we start modifying the DOM
			const matches: Array<{ uri: string; startIndex: number; endIndex: number }> = [];

			let match;
			RIFT_URI_REGEX.lastIndex = 0;
			while ((match = RIFT_URI_REGEX.exec(text)) !== null) {
				matches.push({
					uri: match[0],
					startIndex: match.index,
					endIndex: match.index + match[0].length,
				});
			}

			// Process matches in reverse order (from end to start)
			// This way, the indices remain valid even after DOM modifications
			for (let i = matches.length - 1; i >= 0; i--) {
				const { uri, startIndex, endIndex } = matches[i];

				try {
					// Create range for this match
					const range = document.createRange();
					range.setStart(node, startIndex);
					range.setEnd(node, endIndex);

					// Notify handler
					this.options.onRiftUriFound!(node, uri, range);

					// If we've processed a URI and the DOM has changed, we might need
					// to get a reference to the current node again
					if (!node.parentNode) {
						console.log('Text node was removed from DOM during processing, stopping this node');
						break;
					}
				} catch (error) {
					console.error('Error processing Rift URI:', error);
					console.log('Problematic URI:', uri, 'at indices', startIndex, endIndex);
					console.log('Node text length:', (node.textContent || '').length);
					// Continue with other matches
				}
			}
		}
	}

	/**
	 * Reset the detector's state, including processed nodes cache
	 */
	public reset(): void {
		this.stop();
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

		// Skip nodes that might have been removed from the DOM
		if (!textNode.parentNode) return foundUris;

		// Make a copy of the text content to work with
		const text = textNode.textContent;

		// Collect all matches from the text before we start modifying the DOM
		const matches: Array<{ uri: string; startIndex: number; endIndex: number }> = [];

		let match;
		RIFT_URI_REGEX.lastIndex = 0;
		while ((match = RIFT_URI_REGEX.exec(text)) !== null) {
			matches.push({
				uri: match[0],
				startIndex: match.index,
				endIndex: match.index + match[0].length,
			});
			foundUris.push(match[0]);
		}

		// Process matches in reverse order (from end to start)
		// This way, the indices remain valid even after DOM modifications
		for (let i = matches.length - 1; i >= 0; i--) {
			const { uri, startIndex, endIndex } = matches[i];

			try {
				// Create range for this match
				const range = document.createRange();
				range.setStart(textNode, startIndex);
				range.setEnd(textNode, endIndex);

				// Notify handler
				this.options.onRiftUriFound(textNode, uri, range);

				// If we've processed a URI and the DOM has changed, we might need
				// to get a reference to the current node again
				if (!textNode.parentNode) {
					console.log('Text node was removed from DOM during processing, stopping');
					break;
				}
			} catch (error) {
				console.error('Error processing Rift URI in scanNode:', error);
				// Continue with other matches
			}
		}

		return foundUris;
	}
}
