import { RIFT_URI_SCHEME, RIFT_HTTPS_PREFIX } from '../constants';
import { parseRiftUri } from '../utils';

/**
 * Options for link detection
 */
export interface RiftDetectorOptions {
	/** Function to call when a Rift link is found */
	onRiftLinkFound?: (element: HTMLAnchorElement, riftUrl: string) => void;
	/** Auto-convert links to injectable format */
	autoConvert?: boolean;
	/** Only scan specific elements */
	rootElement?: HTMLElement;
}

/**
 * Default conversion function to transform rift:// URLs to https:// ones
 */
export function convertRiftUrl(url: string): string {
	if (!url.startsWith(RIFT_URI_SCHEME)) {
		return url;
	}

	const parsed = parseRiftUri(url);
	if (!parsed) {
		return url;
	}

	return `${RIFT_HTTPS_PREFIX}${parsed.host}${parsed.path}${parsed.query}`;
}

/**
 * Detector class for finding Rift protocol links in a webpage
 */
export class RiftDetector {
	private options: RiftDetectorOptions;
	private observer: MutationObserver | null = null;

	constructor(options: RiftDetectorOptions = {}) {
		this.options = {
			autoConvert: false,
			rootElement: document.body,
			...options,
		};
	}

	/**
	 * Start scanning for Rift links
	 */
	public start(): void {
		// Initial scan
		this.scanForRiftLinks();

		// Setup observer for new links
		this.observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
					this.scanForRiftLinks();
				}
			});
		});

		this.observer.observe(this.options.rootElement || document.body, {
			childList: true,
			subtree: true,
		});
	}

	/**
	 * Stop scanning for Rift links
	 */
	public stop(): void {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}
	}

	/**
	 * Scan the document for Rift links
	 */
	private scanForRiftLinks(): void {
		const rootElement = this.options.rootElement || document.body;
		const links = rootElement.querySelectorAll<HTMLAnchorElement>('a[href^="rift://"]');

		links.forEach((link) => {
			const href = link.getAttribute('href') || '';

			if (href.startsWith(RIFT_URI_SCHEME)) {
				if (this.options.autoConvert) {
					const httpsUrl = convertRiftUrl(href);
					link.setAttribute('data-original-rift-url', href);
					link.setAttribute('href', httpsUrl);
				}

				if (this.options.onRiftLinkFound) {
					this.options.onRiftLinkFound(link, href);
				}
			}
		});
	}
}

/**
 * Utility function to find all Rift links in a page
 */
export function findRiftLinks(): HTMLAnchorElement[] {
	return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="rift://"]'));
}
