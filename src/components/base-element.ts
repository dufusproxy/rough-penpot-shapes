import { effect } from './reactive.utils';

export interface BaseElementOptions {
  delegatesFocus?: boolean;
}

export abstract class BaseElement extends HTMLElement {
  private _cleanupFns: Array<() => void> = [];
  private _initialized = false;

  // Subclasses declare observed attributes
  static observedAttributes: string[] = [];

  constructor(options?: BaseElementOptions) {
    super();

    // Optional shadow DOM with delegatesFocus for accessibility
    if (options?.delegatesFocus) {
      this.attachShadow({ mode: 'open', delegatesFocus: true });
    }
  }

  connectedCallback(): void {
    if (!this._initialized) {
      this._initialized = true;
      this.setup();
    }
    this.connect();
  }

  disconnectedCallback(): void {
    this.disconnect();
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (oldValue !== newValue) {
      this.onAttributeChanged(name, oldValue, newValue);
    }
  }

  /**
   * Called once when element is first connected
   * Override to set up reactive state and DOM structure
   */
  protected abstract setup(): void;

  /**
   * Called each time element is connected to DOM
   * Override to add event listeners, start animations, etc.
   */
  protected connect(): void {}

  /**
   * Called each time element is disconnected from DOM
   * Override to clean up event listeners, etc.
   */
  protected disconnect(): void {
    this._cleanupFns.forEach(fn => fn());
    this._cleanupFns = [];
  }

  /**
   * Called when an observed attribute changes
   */
  protected onAttributeChanged(
    // @ts-ignore
    name: string,
    // @ts-ignore
    oldValue: string | null,
    // @ts-ignore
    newValue: string | null
  ): void {}

  /**
   * Register a cleanup function to run on disconnect
   */
  protected onCleanup(fn: () => void): void {
    this._cleanupFns.push(fn);
  }

  /**
   * Create a reactive effect that auto-cleans up on disconnect
   */
  protected createEffect(fn: () => void): void {
    const cleanup = effect(fn);
    this.onCleanup(cleanup);
  }

  /**
   * Emit a custom event with the base: prefix
   */
  protected emit<T = unknown>(
    name: string,
    detail?: T,
    options?: Omit<CustomEventInit, 'detail'>
  ): boolean {
    const event = new CustomEvent(`base:${name}`, {
      bubbles: true,
      cancelable: true,
      composed: true,
      ...options,
      detail
    });
    return this.dispatchEvent(event);
  }

  /**
   * Query internal element (light DOM by default)
   */
  protected query<T extends Element = Element>(
    selector: string,
    root: ParentNode = this
  ): T | null {
    return root.querySelector<T>(selector);
  }

  /**
   * Query all internal elements
   */
  protected queryAll<T extends Element = Element>(
    selector: string,
    root: ParentNode = this
  ): T[] {
    return Array.from(root.querySelectorAll<T>(selector));
  }
}

/**
 * Decorator for defining custom elements
 */
export function defineElement(tagName: string) {
  return function <T extends CustomElementConstructor>(constructor: T): T {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, constructor);
    }
    return constructor;
  };
}
