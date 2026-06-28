export function silentError(context) {
  return (err) => {
    if (err) console.warn(`[stickframe] ${context}:`, err?.message || err);
  };
}
