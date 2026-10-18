export function ResourceChange({ amount, label }: { amount?: number; label: string }) {
  if (!amount) return null;
  const signed = `${amount > 0 ? "+" : ""}${amount}`;
  return <small className="resource-change" data-change={amount > 0 ? "increase" : "decrease"}
    aria-label={`Last choice: ${label} ${signed}`} title={`Last choice: ${label} ${signed}`}>{signed}</small>;
}
