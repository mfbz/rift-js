import { RIFT_URI_SCHEME } from '../constants';
import { convertRiftUrl } from './detector';
import { parseRiftUri } from '../utils';

/**
 * Height presets for Rift Frames
 */
export enum FrameHeightPreset {
	COMPACT = 'compact', // Minimal interactions
	STANDARD = 'standard', // Default experience
	TALL = 'tall', // Complex interactions
}

/**
 * Get frame height based on preset
 */
export function getFrameHeight(preset: string | undefined): string {
	switch (preset) {
		case FrameHeightPreset.COMPACT:
			return '200px';
		case FrameHeightPreset.TALL:
			return '500px';
		case FrameHeightPreset.STANDARD:
		default:
			return '350px';
	}
}

/**
 * Options for the iframe injector
 */
export interface IframeInjectorOptions {
	/** Default width of the iframe */
	defaultWidth?: string;
	/** Default height of the iframe */
	defaultHeight?: string;
	/** Default sandbox attributes */
	sandboxAttributes?: string;
	/** Function to call when an iframe is injected */
	onIframeInjected?: (iframe: HTMLIFrameElement, originalElement: HTMLElement) => void;
	/** Function to call when an iframe is removed */
	onIframeRemoved?: (iframe: HTMLIFrameElement, originalElement: HTMLElement) => void;
	/** Function to call when an iframe has a loading error */
	onIframeError?: (error: Error, iframe: HTMLIFrameElement, originalElement: HTMLElement) => void;
}

// Add CSP error detection
document.addEventListener('securitypolicyviolation', (e) => {
	console.error('Content Security Policy violation:', {
		blockedURI: e.blockedURI,
		violatedDirective: e.violatedDirective,
		originalPolicy: e.originalPolicy,
	});
});

/**
 * Default sandbox attributes for security
 */
const DEFAULT_SANDBOX = 'allow-scripts';

/**
 * Utility to inject iframes for Rift links
 */
export class IframeInjector {
	private options: IframeInjectorOptions;
	private injectedFrames: Map<HTMLElement, HTMLIFrameElement> = new Map();

	constructor(options: IframeInjectorOptions = {}) {
		this.options = {
			defaultWidth: '100%',
			defaultHeight: getFrameHeight(FrameHeightPreset.STANDARD),
			sandboxAttributes: DEFAULT_SANDBOX,
			...options,
		};

		// Listen for messages from iframes
		window.addEventListener('message', (event) => {
			// Check if message is from one of our iframes
			const isFromInjectedFrame = Array.from(this.injectedFrames.values()).some(
				(iframe) => iframe.contentWindow === event.source,
			);

			if (isFromInjectedFrame) {
				console.log('Message from Rift iframe:', event.data);
			}
		});
	}

	/**
	 * Inject an iframe for a Rift link
	 * @param element The element to replace with an iframe
	 * @param riftUrl The Rift URL to inject
	 * @returns The injected iframe element
	 */
	public injectFrame(element: HTMLElement, riftUrl: string): HTMLIFrameElement | null {
		// Check if already injected
		if (this.injectedFrames.has(element)) {
			return this.injectedFrames.get(element) || null;
		}

		// Parse Rift URL to extract parameters
		const parsedRiftUrl = parseRiftUri(riftUrl);

		// Convert Rift URL to HTTPS URL
		const iframeUrl = riftUrl.startsWith(RIFT_URI_SCHEME) ? convertRiftUrl(riftUrl) : riftUrl;

		// Create iframe element
		const iframe = document.createElement('iframe');
		iframe.src = iframeUrl;
		iframe.width = this.options.defaultWidth || '100%';

		// Apply height based on preset if available
		if (parsedRiftUrl && parsedRiftUrl.riftParams.height) {
			iframe.height = getFrameHeight(parsedRiftUrl.riftParams.height);
		} else {
			iframe.height = this.options.defaultHeight || getFrameHeight(FrameHeightPreset.STANDARD);
		}

		iframe.style.border = 'none';
		iframe.sandbox.value = this.options.sandboxAttributes || DEFAULT_SANDBOX;
		iframe.setAttribute('data-rift-frame', 'true');
		iframe.setAttribute('data-original-rift-url', riftUrl);

		// Add loading indicator
		const loadingMessage = document.createElement('div');
		loadingMessage.textContent = 'Loading Rift content...';
		loadingMessage.style.padding = '10px';
		loadingMessage.style.textAlign = 'center';
		loadingMessage.style.fontFamily = 'sans-serif';
		element.parentNode?.insertBefore(loadingMessage, element);

		// Add loading and error event handlers
		iframe.addEventListener('load', () => {
			if (loadingMessage.parentNode) {
				loadingMessage.parentNode.removeChild(loadingMessage);
			}
			console.log('Rift iframe loaded:', riftUrl);
		});

		// Set a timeout to detect loading issues
		const timeout = setTimeout(() => {
			console.warn('Rift iframe load timeout:', riftUrl);
			if (iframe.contentDocument) {
				console.info('Iframe content state:', iframe.contentDocument.readyState);
			}
		}, 5000);

		iframe.addEventListener('load', () => clearTimeout(timeout));
		iframe.addEventListener('error', (e) => {
			console.error('Rift iframe loading error:', e);
			clearTimeout(timeout);

			if (this.options.onIframeError) {
				const error = new Error(`Failed to load iframe content: ${riftUrl}`);
				this.options.onIframeError(error, iframe, element);
			}
		});

		// Replace the element with the iframe
		if (element.parentNode) {
			element.parentNode.insertBefore(iframe, element);
			element.style.display = 'none';

			// Store reference
			this.injectedFrames.set(element, iframe);

			// Call callback
			if (this.options.onIframeInjected) {
				this.options.onIframeInjected(iframe, element);
			}

			return iframe;
		}

		return null;
	}

	/**
	 * Remove an injected iframe
	 * @param element The original element
	 * @returns Whether the iframe was removed
	 */
	public removeFrame(element: HTMLElement): boolean {
		const iframe = this.injectedFrames.get(element);

		if (iframe && iframe.parentNode) {
			iframe.parentNode.removeChild(iframe);
			element.style.display = '';
			this.injectedFrames.delete(element);

			// Call callback
			if (this.options.onIframeRemoved) {
				this.options.onIframeRemoved(iframe, element);
			}

			return true;
		}

		return false;
	}

	/**
	 * Remove all injected iframes
	 */
	public removeAllFrames(): void {
		this.injectedFrames.forEach((iframe, element) => {
			this.removeFrame(element);
		});
	}

	/**
	 * Get all currently injected iframes
	 */
	public getInjectedFrames(): Map<HTMLElement, HTMLIFrameElement> {
		return new Map(this.injectedFrames);
	}
}
