import { useCallback, useEffect, useRef, useState } from 'react';

// Loads data once and keeps { data, error, loading, reload } in one place.
//   const { data, error, loading, reload } = useApi(() => getTodayReport(), []);
// Pass { refreshOnFocus: true } to reload when the user comes back to the tab
// (so e.g. a CEO review shows up without a page reload).
export function useApi(fetcher, deps, { refreshOnFocus = false } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fetcher, deps);

  const reload = useCallback(
    async ({ silent = false } = {}) => {
      const id = ++requestId.current;
      if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await load();
        if (id === requestId.current) setState({ data, error: null, loading: false });
      } catch (error) {
        // A failed background refresh keeps the data already on screen.
        if (id === requestId.current) setState((s) => (silent && s.data ? s : { data: null, error, loading: false }));
      }
    },
    [load],
  );

  useEffect(() => {
    reload();
    return () => {
      requestId.current++; // ignore answers that arrive after the page is closed
    };
  }, [reload]);

  useEffect(() => {
    if (!refreshOnFocus) return;
    const onFocus = () => reload({ silent: true });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshOnFocus, reload]);

  return { ...state, reload };
}
