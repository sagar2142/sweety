import { useCallback, useEffect, useState, type DependencyList } from 'react';

interface AsyncState<T> {
  data: T | undefined;
  error: string;
  loading: boolean;
}

/**
 * Runs `load` when the component mounts and whenever `deps` change.
 * Keeps the previous data while re-loading (no flicker) and ignores
 * results that arrive after the inputs have changed.
 */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: '', loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: '' }));

    load()
      .then((data) => {
        if (!cancelled) setState({ data, error: '', loading: false });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Something went wrong.';
        setState((current) => ({ ...current, error: message, loading: false }));
      });

    return () => {
      cancelled = true;
    };
    // `load` is a new function on every render, so callers list its real inputs in `deps`.
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);

  return { ...state, reload };
}
