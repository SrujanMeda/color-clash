import { useEffect, useState } from 'react';

// Counts down locally from the server-provided remaining time to avoid clock skew.
export default function useCountdown(remainingMs) {
  const [endsAt] = useState(() => Date.now() + remainingMs);
  const [left, setLeft] = useState(remainingMs);

  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, endsAt - Date.now())), 100);
    return () => clearInterval(id);
  }, [endsAt]);

  return Math.ceil(left / 1000);
}
