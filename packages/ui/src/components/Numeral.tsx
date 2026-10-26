/**
 * The number of a step or a rule. In a rule list (`column`) it is large and faint in its own column;
 * above a step's title it is small, muted and two digits ("01"). The list itself carries the order.
 */
export function Numeral({ n, column = false }: { n: number; column?: boolean }) {
  if (column)
    return (
      <span className="t-data-lg text-ink-faint w-8 shrink-0 tabular-nums" aria-hidden="true">
        {n}
      </span>
    );
  return (
    <span className="t-data text-ink-muted block tabular-nums" aria-hidden="true">
      {String(n).padStart(2, "0")}
    </span>
  );
}
