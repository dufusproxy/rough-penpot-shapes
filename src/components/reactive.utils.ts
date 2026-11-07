import { signal, computed, effect, startBatch, endBatch } from 'alien-signals';

export { signal, computed, effect };

/**
 * Batches multiple signal updates to prevent intermediate re-renders
 */
export function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}

export type Signal<T> = ReturnType<typeof signal<T>>;
export type Computed<T> = ReturnType<typeof computed<T>>;

/**
 * Creates a reactive property that syncs with an HTML attribute
 */
export function attributeSignal<T extends string | boolean | number>(
  element: HTMLElement,
  attributeName: string,
  defaultValue: T,
  transform?: {
    toAttribute: (value: T) => string | null;
    fromAttribute: (value: string | null) => T;
  }
): Signal<T> {
  const sig = signal<T>(defaultValue);

  const defaultTransform = {
    toAttribute: (value: T): string | null => {
      if (typeof value === 'boolean') {
        return value ? '' : null;
      }
      return String(value);
    },
    fromAttribute: (value: string | null): T => {
      if (typeof defaultValue === 'boolean') {
        return (value !== null) as T;
      }
      if (typeof defaultValue === 'number') {
        return (value !== null ? Number(value) : defaultValue) as T;
      }
      return (value ?? defaultValue) as T;
    }
  };

  const { toAttribute, fromAttribute } = transform ?? defaultTransform;

  // Sync signal changes to attribute
  effect(() => {
    const attrValue = toAttribute(sig());
    if (attrValue === null) {
      element.removeAttribute(attributeName);
    } else {
      element.setAttribute(attributeName, attrValue);
    }
  });

  // Sync attribute changes back to signal
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.attributeName === attributeName) {
        const attrValue = element.getAttribute(attributeName);
        sig(fromAttribute(attrValue));
      }
    }
  });

  observer.observe(element, { attributes: true });

  return sig;
}
