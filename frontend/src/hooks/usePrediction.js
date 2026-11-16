import { useEffect, useRef, useState } from 'react';
import { apiError, predictInsights } from '../api/client.js';

const REQUIRED = ['age', 'attendancePct', 'studyHours', 'previousCgpa', 'sleepHours', 'socialHours', 'gender', 'major'];

/** Debounced call to /predict/insights. Re-runs when the form changes. */
export function usePrediction(form, delay = 350) {
  const [state, setState] = useState({ result: null, loading: true, error: null });
  const ticket = useRef(0);

  useEffect(() => {
    if (REQUIRED.some((k) => form[k] === '' || form[k] === null || form[k] === undefined)) {
      setState((s) => ({ ...s, loading: false }));
      return undefined;
    }
    const mine = ++ticket.current;
    setState((s) => ({ ...s, loading: true }));
    const timer = setTimeout(async () => {
      try {
        const result = await predictInsights(form);
        if (mine === ticket.current) setState({ result, loading: false, error: null });
      } catch (err) {
        if (mine === ticket.current) setState((s) => ({ ...s, loading: false, error: apiError(err, 'Prediction failed.') }));
      }
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(form)]);

  return state;
}
