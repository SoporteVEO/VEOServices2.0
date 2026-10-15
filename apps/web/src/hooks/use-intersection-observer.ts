import { useCallback, useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Returns a callback ref so the observer attaches whenever the target mounts,
 * including targets rendered after `enabled` flips (e.g. inside portals).
 */
export function useIntersectionObserver<T extends Element>(
  callback: () => void,
  options: UseIntersectionObserverOptions = {},
) {
  const { enabled = true, rootMargin = "200px", threshold = 0 } = options;
  const [target, setTarget] = useState<T | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !target || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) callbackRef.current();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, target, rootMargin, threshold]);

  return useCallback((node: T | null) => setTarget(node), []);
}
