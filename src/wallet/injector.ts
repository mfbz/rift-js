import { RIFT_URI_SCHEME } from '../constants';
import { convertRiftUrl } from './detector';

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
}

/**
 * Default sandbox attributes for security
 */
const DEFAULT_SANDBOX = 'allow-scripts allow-forms allow-popups allow-downloads allow-same-origin';

/**
 * Utility to inject iframes for Rift links
 */
export class IframeInjector {
	private options: IframeInjectorOptions;
	private injectedFrames: Map<HTMLElement, HTMLIFrameElement> = new Map();

	constructor(options: IframeInjectorOptions = {}) {
		this.options = {
			defaultWidth: '100%',
			defaultHeight: '300px',
			sandboxAttributes: DEFAULT_SANDBOX,
			...options,
		};
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

		// Convert Rift URL to HTTPS URL
		const iframeUrl = riftUrl.startsWith(RIFT_URI_SCHEME) ? convertRiftUrl(riftUrl) : riftUrl;

		// Create iframe element
		const iframe = document.createElement('iframe');
		iframe.src = iframeUrl;
		iframe.width = this.options.defaultWidth || '100%';
		iframe.height = this.options.defaultHeight || '300px';
		iframe.style.border = 'none';
		iframe.sandbox.value = this.options.sandboxAttributes || DEFAULT_SANDBOX;
		iframe.setAttribute('data-rift-frame', 'true');
		iframe.setAttribute('data-original-rift-url', riftUrl);

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
