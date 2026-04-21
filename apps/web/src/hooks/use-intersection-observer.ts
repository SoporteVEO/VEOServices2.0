import { useEffect, useRef } from "react";

interface UseIntersectionObserverOptions {
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
}

export function useIntersectionObserver<T extends Element>(
  callback: () => void,
  options: UseIntersectionObserverOptions = {},
) {
  const { enabled = true, rootMargin = "200px", threshold = 0 } = options;
  const ref = useRef<T>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;
    const target = ref.current;
    if (!target || typeof IntersectionObserver === "undefined") return;

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
  }, [enabled, rootMargin, threshold]);

  return ref;
}
